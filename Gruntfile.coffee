module.exports = (grunt) ->

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')

    connect:
      server:
        options:
          keepalive: true
          port: 9002
          base: '.'


  grunt.registerTask('default', ['connect']);






















