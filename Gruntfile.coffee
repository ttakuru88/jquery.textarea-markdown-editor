module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    clean:
      all: ['dist']
    watch:
      coffee:
        tasks: ['coffee']
        files: ['src/*.coffee']
    coffee:
      main:
        files:
          'dist/jquery.textareaMarkdownable.js': 'src/jquery.textareaMarkdownable.coffee'
    copy:
      main:
        files:
          'dist/index.html': 'src/index.html'

  grunt.registerTask 'default', ['clean', 'coffee', 'copy']

  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')
