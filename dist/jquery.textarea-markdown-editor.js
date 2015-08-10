(function() {
  var KeyCodes, MarkdownEditor,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  KeyCodes = {
    tab: 9,
    enter: 13,
    space: 32
  };

  MarkdownEditor = (function() {
    var beginCodeblockFormat, emptyRowFormat, endCodeblockFormat, hrFormat, listFormat, makingTableFormat, rowFormat, rowSepFormat;

    listFormat = /^(\s*(-|\*|\+|\d+?\.)\s+(\[(\s|x)\]\s+)?)(\S*)/;

    hrFormat = /^\s*((-\s+-\s+-(\s+-)*)|(\*\s+\*\s+\*(\s+\*)*))\s*$/;

    rowFormat = /^\|(.*?\|)+\s*$/;

    rowSepFormat = /^\|(\s*:?---+:?\s*\|)+\s*$/;

    emptyRowFormat = /^\|(\s*?\|)+\s*$/;

    beginCodeblockFormat = /^((```+)|(~~~+))(\S*\s*)$/;

    endCodeblockFormat = /^((```+)|(~~~+))$/;

    makingTableFormat = /^(:?)(\d+)x(\d+)(:?)$/;

    function MarkdownEditor(el, options1) {
      var i, k, ref;
      this.el = el;
      this.options = options1;
      this.onPressTab = bind(this.onPressTab, this);
      this.$el = $(this.el);
      this.selectionBegin = this.selectionEnd = 0;
      this.tabSpaces = '';
      for (i = k = 0, ref = this.options.tabSize; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        this.tabSpaces += ' ';
      }
      this.$el.on('keydown.markdownEditor', (function(_this) {
        return function(e) {
          if (e.keyCode === KeyCodes.enter && !e.shiftKey) {
            if (_this.options.list) {
              _this.supportInputListFormat(e);
            }
            if (_this.options.table) {
              _this.supportInputTableFormat(e);
            }
            if (_this.options.codeblock) {
              _this.supportCodeblockFormat(e);
            }
          }
          if (e.keyCode === KeyCodes.space && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            if (_this.options.list) {
              _this.toggleCheck(e);
            }
            if (_this.options.autoTable) {
              _this.makeTable(e);
            }
          }
          if (e.keyCode === KeyCodes.tab) {
            return _this.onPressTab(e);
          }
        };
      })(this));
    }

    MarkdownEditor.prototype.getTextArray = function() {
      return this.getText().split('');
    };

    MarkdownEditor.prototype.getText = function() {
      return this.el.value;
    };

    MarkdownEditor.prototype.supportInputListFormat = function(e) {
      var base, currentLine, extSpace, match, pos, text;
      text = this.getTextArray();
      currentLine = this.getCurrentLine(text);
      if (currentLine.match(hrFormat)) {
        return;
      }
      match = currentLine.match(listFormat);
      if (!match) {
        return;
      }
      pos = this.getSelectionStart();
      if (text[pos] && text[pos] !== "\n") {
        return;
      }
      if (match[5].length <= 0) {
        this.removeCurrentLine(text);
        return;
      }
      extSpace = e.ctrlKey ? this.tabSpaces : '';
      this.insert(text, "\n" + extSpace + match[1]);
      e.preventDefault();
      return typeof (base = this.options).onInsertedList === "function" ? base.onInsertedList(e) : void 0;
    };

    MarkdownEditor.prototype.toggleCheck = function(e) {
      var currentLine, line, matches, pos, text;
      text = this.getTextArray();
      currentLine = this.getCurrentLine(text);
      matches = currentLine.match(listFormat);
      if (!matches) {
        return;
      }
      if (!matches[4]) {
        return;
      }
      line = '';
      if (matches[4] === 'x') {
        line = currentLine.replace('[x]', '[ ]');
      } else {
        line = currentLine.replace('[ ]', '[x]');
      }
      pos = this.getSelectionStart();
      this.replaceCurrentLine(text, pos, currentLine, line);
      return e.preventDefault();
    };

    MarkdownEditor.prototype.replaceCurrentLine = function(text, pos, oldLine, newLine) {
      var beginPos;
      beginPos = this.getPosBeginningOfLine(text, pos);
      text.splice(beginPos, oldLine.length, newLine);
      this.el.value = text.join('');
      return this.setSelectionRange(pos, pos);
    };

    MarkdownEditor.prototype.supportInputTableFormat = function(e) {
      var base, char, currentLine, i, k, l, len, m, match, pos, prevPos, ref, ref1, row, rows, selectionStart, sep, text;
      text = this.getTextArray();
      currentLine = this.replaceEscapedPipe(this.getCurrentLine(text));
      selectionStart = this.getSelectionStart();
      match = currentLine.match(rowFormat);
      if (!match) {
        return;
      }
      if (this.isTableHeader(text)) {
        return;
      }
      if (selectionStart === this.getPosBeginningOfLine(text, selectionStart)) {
        return;
      }
      if (currentLine.match(emptyRowFormat) && this.isTableBody(text)) {
        this.removeCurrentLine(text);
        return;
      }
      e.preventDefault();
      rows = -1;
      for (k = 0, len = currentLine.length; k < len; k++) {
        char = currentLine[k];
        if (char === '|') {
          rows++;
        }
      }
      prevPos = this.getPosEndOfLine(text);
      sep = '';
      if (!this.isTableBody(text)) {
        sep = "\n|";
        for (i = l = 0, ref = rows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
          sep += " " + this.options.tableSeparator + " |";
        }
      }
      row = "\n|";
      for (i = m = 0, ref1 = rows; 0 <= ref1 ? m < ref1 : m > ref1; i = 0 <= ref1 ? ++m : --m) {
        row += '  |';
      }
      text = this.insert(text, sep + row, prevPos);
      pos = prevPos + sep.length + row.length - rows * 3 + 1;
      this.setSelectionRange(pos, pos);
      return typeof (base = this.options).onInsertedTable === "function" ? base.onInsertedTable(e) : void 0;
    };

    MarkdownEditor.prototype.supportCodeblockFormat = function(e) {
      var base, currentLine, match, selectionStart, text;
      text = this.getTextArray();
      selectionStart = this.getSelectionStart();
      currentLine = this.getCurrentLine(text);
      match = currentLine.match(beginCodeblockFormat);
      if (text[selectionStart + 1] && text[selectionStart + 1] !== "\n") {
        return;
      }
      if (!match) {
        return;
      }
      if (!this.requireCodeblockEnd(text, selectionStart)) {
        return;
      }
      e.preventDefault();
      this.insert(text, "\n\n" + match[1]);
      this.setSelectionRange(selectionStart + 1, selectionStart + 1);
      return typeof (base = this.options).onInsertedCodeblock === "function" ? base.onInsertedCodeblock(e) : void 0;
    };

    MarkdownEditor.prototype.requireCodeblockEnd = function(text, selectionStart) {
      var innerCodeblock, line, pos;
      innerCodeblock = this.isInnerCodeblock(text, selectionStart);
      if (innerCodeblock) {
        return false;
      }
      pos = this.getPosBeginningOfLine(text, selectionStart);
      while (pos <= text.length) {
        line = this.getCurrentLine(text, pos);
        if (innerCodeblock && line.match(endCodeblockFormat)) {
          return false;
        } else if (!innerCodeblock && line.match(beginCodeblockFormat)) {
          innerCodeblock = true;
        }
        pos += line.length + 1;
      }
      return true;
    };

    MarkdownEditor.prototype.isInnerCodeblock = function(text, selectionStart) {
      var endPos, innerCodeblock, line, pos;
      if (selectionStart == null) {
        selectionStart = this.getSelectionStart();
      }
      innerCodeblock = false;
      pos = 0;
      endPos = this.getPosBeginningOfLine(text, selectionStart) - 1;
      while (pos < endPos) {
        line = this.getCurrentLine(text, pos);
        if (innerCodeblock && line.match(endCodeblockFormat)) {
          innerCodeblock = false;
        } else if (!innerCodeblock && line.match(beginCodeblockFormat)) {
          innerCodeblock = true;
        }
        pos += line.length + 1;
      }
      return innerCodeblock;
    };

    MarkdownEditor.prototype.makeTable = function(e) {
      var alignLeft, alignRight, line, matches, pos, table, text;
      text = this.getTextArray();
      line = this.getCurrentLine(text);
      matches = line.match(makingTableFormat);
      if (!matches) {
        return;
      }
      e.preventDefault();
      alignLeft = !!matches[1].length;
      alignRight = !!matches[4].length;
      table = this.buildTable(matches[2], matches[3], {
        alignLeft: alignLeft,
        alignRight: alignRight
      });
      pos = this.getPosBeginningOfLine(text);
      this.replaceCurrentLine(text, pos, line, table);
      return this.setSelectionRange(pos + 2, pos + 2);
    };

    MarkdownEditor.prototype.buildTable = function(rowsCount, colsCount, options) {
      var i, j, k, l, m, n, ref, ref1, ref2, ref3, separator, table;
      if (options == null) {
        options = {};
      }
      separator = "---";
      if (options.alignLeft) {
        separator = ":" + separator;
      }
      if (options.alignRight) {
        separator = separator + ":";
      }
      table = "|";
      for (i = k = 0, ref = rowsCount; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        table += '  |';
      }
      table += "\n|";
      for (i = l = 0, ref1 = rowsCount; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        table += " " + separator + " |";
      }
      for (i = m = 0, ref2 = colsCount - 1; 0 <= ref2 ? m < ref2 : m > ref2; i = 0 <= ref2 ? ++m : --m) {
        table += "\n|";
        for (j = n = 0, ref3 = rowsCount; 0 <= ref3 ? n < ref3 : n > ref3; j = 0 <= ref3 ? ++n : --n) {
          table += "  |";
        }
      }
      return table;
    };

    MarkdownEditor.prototype.setSelectionRange = function(selectionBegin, selectionEnd) {
      this.selectionBegin = selectionBegin;
      this.selectionEnd = selectionEnd;
      return this.el.setSelectionRange(this.selectionBegin, this.selectionEnd);
    };

    MarkdownEditor.prototype.replaceEscapedPipe = function(text) {
      return text.replace(/\\\|/g, '..');
    };

    MarkdownEditor.prototype.isTableHeader = function(text, pos) {
      var ep, line;
      if (text == null) {
        text = this.getTextArray();
      }
      if (pos == null) {
        pos = this.getSelectionStart() - 1;
      }
      ep = pos = this.getPosEndOfLine(text, pos) + 1;
      line = this.getCurrentLine(text, pos);
      return line.match(rowSepFormat);
    };

    MarkdownEditor.prototype.isTableBody = function(textArray, pos) {
      var line;
      if (textArray == null) {
        textArray = this.getTextArray();
      }
      if (pos == null) {
        pos = this.getSelectionStart() - 1;
      }
      line = this.replaceEscapedPipe(this.getCurrentLine(textArray, pos));
      while (line.match(rowFormat) && pos > 0) {
        if (line.match(rowSepFormat)) {
          return true;
        }
        pos = this.getPosBeginningOfLine(textArray, pos) - 2;
        line = this.replaceEscapedPipe(this.getCurrentLine(textArray, pos));
      }
      return false;
    };

    MarkdownEditor.prototype.getPrevLine = function(textArray, pos) {
      if (pos == null) {
        pos = this.getSelectionStart() - 1;
      }
      pos = this.getPosBeginningOfLine(textArray, pos);
      return this.getCurrentLine(textArray, pos - 2);
    };

    MarkdownEditor.prototype.getPosEndOfLine = function(textArray, pos) {
      if (pos == null) {
        pos = this.getSelectionStart();
      }
      while (textArray[pos] && textArray[pos] !== "\n") {
        pos++;
      }
      return pos;
    };

    MarkdownEditor.prototype.getPosBeginningOfLine = function(textArray, pos) {
      if (pos == null) {
        pos = this.getSelectionStart();
      }
      while (textArray[pos - 1] && textArray[pos - 1] !== "\n") {
        pos--;
      }
      return pos;
    };

    MarkdownEditor.prototype.getPosBeginningOfLines = function(text, startPos, endPos) {
      var beginningPositions, k, pos, ref, ref1;
      if (startPos == null) {
        startPos = this.getSelectionStart();
      }
      if (endPos == null) {
        endPos = this.getSelectionEnd();
      }
      beginningPositions = [this.getPosBeginningOfLine(text, startPos)];
      startPos = this.getPosEndOfLine(startPos) + 1;
      if (startPos < endPos) {
        for (pos = k = ref = startPos, ref1 = endPos; ref <= ref1 ? k <= ref1 : k >= ref1; pos = ref <= ref1 ? ++k : --k) {
          if (!text[pos]) {
            break;
          }
          if (pos > 0 && text[pos - 1] === "\n") {
            beginningPositions.push(pos);
          }
        }
      }
      return beginningPositions;
    };

    MarkdownEditor.prototype.getCurrentLine = function(text, initPos) {
      var afterChars, beforeChars, pos;
      if (text == null) {
        text = this.getText();
      }
      if (initPos == null) {
        initPos = this.getSelectionStart() - 1;
      }
      pos = initPos;
      beforeChars = '';
      while (text[pos] && text[pos] !== "\n") {
        beforeChars = "" + text[pos] + beforeChars;
        pos--;
      }
      pos = initPos + 1;
      afterChars = '';
      while (text[pos] && text[pos] !== "\n") {
        afterChars = "" + afterChars + text[pos];
        pos++;
      }
      return "" + beforeChars + afterChars;
    };

    MarkdownEditor.prototype.removeCurrentLine = function(textArray) {
      var beginPos, endPos, removeLength;
      endPos = this.getPosEndOfLine(textArray);
      beginPos = this.getPosBeginningOfLine(textArray);
      removeLength = endPos - beginPos;
      textArray.splice(beginPos, removeLength);
      this.el.value = textArray.join('');
      return this.setSelectionRange(beginPos, beginPos);
    };

    MarkdownEditor.prototype.onPressTab = function(e) {
      e.preventDefault();
      if (this.options.table && this.moveCursorOnTableCell(e)) {
        return;
      }
      if (this.options.tabToSpace) {
        return this.tabToSpace(e);
      }
    };

    MarkdownEditor.prototype.moveCursorOnTableCell = function(e) {
      var currentLine, text;
      text = this.replaceEscapedPipe(this.getText());
      currentLine = this.getCurrentLine(text);
      if (!currentLine.match(rowFormat)) {
        return false;
      }
      if (e.shiftKey) {
        this.moveToPrevCell(text);
      } else {
        this.moveToNextCell(text);
      }
      return true;
    };

    MarkdownEditor.prototype.tabToSpace = function(e) {
      var beginPos, currentLine, currentPos, dPos, i, k, l, len, listPositions, m, pos, ref, ref1, ref2, text;
      text = this.getTextArray();
      listPositions = [];
      if (this.options.list) {
        dPos = 0;
        currentPos = this.getSelectionStart();
        ref = this.getPosBeginningOfLines(text, currentPos);
        for (k = 0, len = ref.length; k < len; k++) {
          pos = ref[k];
          pos += dPos;
          currentLine = this.getCurrentLine(text, pos);
          if (currentLine.match(listFormat) && !currentLine.match(hrFormat)) {
            listPositions.push(pos);
            if (e.shiftKey) {
              if (currentLine.indexOf(this.tabSpaces) === 0) {
                text.splice(pos, this.options.tabSize);
                dPos -= this.options.tabSize;
              }
            } else {
              for (i = l = 0, ref1 = this.options.tabSize; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
                text.splice(pos, 0, ' ');
              }
              dPos += this.options.tabSize;
            }
          }
        }
        this.el.value = text.join('');
        if (listPositions.length > 1) {
          this.setSelectionRange(listPositions[0], this.getPosEndOfLine(text, listPositions[listPositions.length - 1]));
        } else {
          if (dPos < 0) {
            beginPos = this.getPosBeginningOfLine(text, currentPos + dPos);
            for (i = m = -1, ref2 = -this.options.tabSize; -1 <= ref2 ? m <= ref2 : m >= ref2; i = -1 <= ref2 ? ++m : --m) {
              if ((!text[currentPos + i] || text[currentPos + i] === "\n") && listPositions[0] > beginPos) {
                currentPos = listPositions[0] - dPos;
                break;
              }
            }
          }
          this.setSelectionRange(currentPos + dPos, currentPos + dPos);
        }
      }
      if (!listPositions.length) {
        return this.insert(text, this.tabSpaces);
      }
    };

    MarkdownEditor.prototype.moveToPrevCell = function(text, pos) {
      var ep, epAdded, overSep, prevLine, sp, ssp;
      if (pos == null) {
        pos = this.getSelectionStart() - 1;
      }
      overSep = false;
      prevLine = false;
      ep = pos;
      while (text[ep]) {
        if (overSep && ep < 0 || !overSep && ep <= 0) {
          return false;
        }
        if (prevLine && text[ep] !== ' ' && text[ep] !== '|') {
          return false;
        }
        if (!overSep) {
          if (text[ep] === '|') {
            overSep = true;
            prevLine = false;
          }
        } else if (text[ep] !== ' ') {
          if (text[ep] === "\n") {
            overSep = false;
            prevLine = true;
          } else {
            if (text[ep] === '|') {
              ep++;
            }
            if (text[ep] === ' ') {
              ep++;
            }
            break;
          }
        }
        ep--;
      }
      if (ep < 0) {
        return false;
      }
      ssp = sp = ep;
      epAdded = false;
      while (text[sp] && text[sp] !== '|') {
        if (text[sp] !== ' ') {
          ssp = sp;
          if (!epAdded) {
            ep++;
            epAdded = true;
          }
        }
        sp--;
      }
      this.setSelectionRange(ssp, ep);
      return true;
    };

    MarkdownEditor.prototype.moveToNextCell = function(text, pos) {
      var eep, ep, overSep, overSepSpace, sp;
      if (pos == null) {
        pos = this.getSelectionStart();
      }
      overSep = false;
      overSepSpace = false;
      eep = null;
      sp = pos;
      while (text[sp]) {
        if (sp > 0 && text[sp - 1] === "\n" && text[sp] !== '|') {
          sp--;
          eep = sp;
          break;
        }
        if (!overSep) {
          if (text[sp] === '|') {
            overSep = true;
          }
        } else if (text[sp] !== ' ') {
          if (text[sp] === "\n") {
            overSep = false;
          } else {
            break;
          }
        } else {
          if (overSepSpace) {
            break;
          }
          overSepSpace = true;
        }
        sp++;
      }
      if (!text[sp]) {
        sp--;
        eep = sp;
      }
      if (!eep) {
        eep = ep = sp;
        while (text[ep] && text[ep] !== '|') {
          if (text[ep] !== ' ') {
            eep = ep + 1;
          }
          ep++;
        }
      }
      this.setSelectionRange(sp, eep);
      return true;
    };

    MarkdownEditor.prototype.insertSpaces = function(text, pos) {
      var nextPos;
      nextPos = this.getSelectionStart() + this.tabSpaces.length;
      this.insert(text, this.tabSpaces, pos);
      return this.setSelectionRange(nextPos, nextPos);
    };

    MarkdownEditor.prototype.insert = function(textArray, insertText, pos) {
      if (pos == null) {
        pos = this.getSelectionStart();
      }
      textArray.splice(pos, 0, insertText);
      this.el.value = textArray.join('');
      pos += insertText.length;
      return this.setSelectionRange(pos, pos);
    };

    MarkdownEditor.prototype.getSelectionStart = function() {
      return this.el.selectionStart;
    };

    MarkdownEditor.prototype.getSelectionEnd = function() {
      return this.el.selectionEnd;
    };

    MarkdownEditor.prototype.destroy = function() {
      this.$el.off('keydown.markdownEditor').data('markdownEditor', null);
      return this.$el = null;
    };

    return MarkdownEditor;

  })();

  $.fn.markdownEditor = function(options, args) {
    if (options == null) {
      options = {};
    }
    if (args == null) {
      args = void 0;
    }
    if (typeof options === 'string') {
      return this.each(function() {
        var base;
        return typeof (base = $(this).data('markdownEditor'))[options] === "function" ? base[options](args) : void 0;
      });
    } else {
      options = $.extend({
        tabSize: 4,
        onInsertedList: null,
        onInsertedTable: null,
        onInsertedCodeblock: null,
        tabToSpace: true,
        list: true,
        table: true,
        codeblock: true,
        autoTable: true,
        tableSeparator: '---'
      }, options);
      this.each(function() {
        return $(this).data('markdownEditor', new MarkdownEditor(this, options));
      });
      return this;
    }
  };

}).call(this);
