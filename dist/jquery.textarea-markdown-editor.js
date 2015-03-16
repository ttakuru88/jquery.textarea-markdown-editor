(function() {
  var KeyCodes, MarkdownEditor,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  KeyCodes = {
    tab: 9,
    enter: 13
  };

  MarkdownEditor = (function() {
    MarkdownEditor.prototype.list_format = /^(\s*(-|\*|\+|\d+?\.)\s+(\[(\s|x)\]\s+)?)(\S*)/;

    function MarkdownEditor(el, options1) {
      var i, j, ref;
      this.el = el;
      this.options = options1;
      this.tab_to_space = bind(this.tab_to_space, this);
      this.$el = $(this.el);
      this.tab_spaces = '';
      for (i = j = 0, ref = this.options.tabSize; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        this.tab_spaces += ' ';
      }
      this.$el.on('keydown', (function(_this) {
        return function(e) {
          _this.support_input_list_format(e);
          return _this.tab_to_space(e);
        };
      })(this));
    }

    MarkdownEditor.prototype.support_input_list_format = function(e) {
      var base, current_line, ext_space, match, text;
      if (e.keyCode !== KeyCodes.enter || e.shiftKey) {
        return;
      }
      text = this.$el.val().split('');
      current_line = this.get_current_line(text);
      match = current_line.match(this.list_format);
      if (!match) {
        return;
      }
      if (match[5].length <= 0) {
        this.remove_current_line(text);
        return;
      }
      ext_space = e.ctrlKey ? this.tab_spaces : '';
      this.insert(text, "\n" + ext_space + match[1]);
      e.preventDefault();
      return typeof (base = this.options).onInsertedList === "function" ? base.onInsertedList(e) : void 0;
    };

    MarkdownEditor.prototype.get_current_line = function(text_array) {
      var after_chars, before_chars, pos;
      pos = this.current_pos() - 1;
      before_chars = '';
      while (text_array[pos] && text_array[pos] !== "\n") {
        before_chars = "" + text_array[pos] + before_chars;
        pos--;
      }
      pos = this.current_pos();
      after_chars = '';
      while (text_array[pos] && text_array[pos] !== "\n") {
        after_chars = "" + after_chars + text_array[pos];
        pos++;
      }
      return "" + before_chars + after_chars;
    };

    MarkdownEditor.prototype.remove_current_line = function(text_array) {
      var begin_pos, end_pos, remove_length;
      end_pos = this.current_pos();
      begin_pos = this.get_head_pos(text_array, end_pos);
      remove_length = end_pos - begin_pos;
      text_array.splice(begin_pos, remove_length);
      this.$el.val(text_array.join(''));
      return this.el.setSelectionRange(begin_pos, begin_pos);
    };

    MarkdownEditor.prototype.tab_to_space = function(e) {
      var current_line, pos, text;
      if (e.keyCode !== KeyCodes.tab) {
        return;
      }
      e.preventDefault();
      text = this.$el.val().split('');
      current_line = this.get_current_line(text);
      if (current_line.match(this.list_format)) {
        pos = this.get_head_pos(text);
        if (e.shiftKey) {
          if (current_line.indexOf(this.tab_spaces) === 0) {
            return this.remove_spaces(text, pos);
          }
        } else {
          return this.insert_spaces(text, pos);
        }
      } else {
        return this.insert(text, this.tab_spaces);
      }
    };

    MarkdownEditor.prototype.insert_spaces = function(text, pos) {
      var next_pos;
      next_pos = this.current_pos() + this.tab_spaces.length;
      this.insert(text, this.tab_spaces, pos);
      return this.el.setSelectionRange(next_pos, next_pos);
    };

    MarkdownEditor.prototype.remove_spaces = function(text, pos) {
      text.splice(pos, this.tab_spaces.length);
      pos = this.current_pos() - this.tab_spaces.length;
      this.$el.val(text.join(''));
      return this.el.setSelectionRange(pos, pos);
    };

    MarkdownEditor.prototype.get_head_pos = function(text_array, pos) {
      if (pos == null) {
        pos = this.current_pos();
      }
      while (pos > 0 && text_array[pos - 1] !== "\n") {
        pos--;
      }
      return pos;
    };

    MarkdownEditor.prototype.insert = function(text_array, insert_text, pos) {
      if (pos == null) {
        pos = this.current_pos();
      }
      text_array.splice(pos, 0, insert_text);
      this.$el.val(text_array.join(''));
      pos += insert_text.length;
      return this.el.setSelectionRange(pos, pos);
    };

    MarkdownEditor.prototype.current_pos = function() {
      return this.$el.caret('pos');
    };

    return MarkdownEditor;

  })();

  $.fn.markdownEditor = function(options) {
    if (options == null) {
      options = {};
    }
    options = $.extend({
      tabSize: 2,
      onInsertedList: null
    }, options);
    this.each(function() {
      return $(this).data('markdownEditor', new MarkdownEditor(this, options));
    });
    return this;
  };

}).call(this);
