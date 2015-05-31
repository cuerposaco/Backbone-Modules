module.exports = function(grunt) {

  grunt.initConfig({

    config: {
      testPort: 3000,
      moduleName:'testModule',
      buildFolder: 'build',
      srcFolder: 'src',
      testFolder: 'www-test'
    },
    
    pkg: grunt.file.readJSON('package.json'),

    /**
    *  Donwload bower files [for testing]
    */
    bower : {
      install : {
        options : {
          targetDir : 'vendor',
          layout : 'byComponent',
          verbose: true,
          cleanup: true
        }
      }
    },

    /**
    *  Concat bower files [for testing]
    */
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['vendor/**/jquery.js','vendor/**/underscore.js','vendor/**/backbone.js','vendor/**/*.js'],
        dest: '<%= config.testFolder %>/public/vendors.js',
      },
    },

    /**
    *  Compress module file [for production] 
    *  & bower vendors [for testing]
    */
    uglify: {
      vendors: {
        files: {
          '<%= config.testFolder %>/public/vendors.min.js': ['<%= config.testFolder %>/public/vendors.js']
        }
      },
      module: {
        files: {
          '<%= config.buildFolder %>/<%= config.moduleName %>.min.js': ['<%= config.buildFolder %>/<%= config.moduleName %>.js']
        }
      }
    },

    /**
    *  Validate JS code
    */
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },

    /**
    *  Watch for changes an live reload
    */
    watch: {
      files: ['<%= jshint.files %>', '<%= config.srcFolder %>/**/*' ],
      tasks: ['browserify','uglify:module'],
      options:{livereload:true}
    },

    /**
    *  Create server [for testing]
    */
    connect: {
      server: {
        options: {
          port: '<%= config.testPort %>',
          hostname: '*',
          livereload:true,
          open:true,
          base:['<%= config.testFolder %>','./'],
          path: 'http://localhost:<%= config.testPort %>'
        }
      }
    },
    
    /**
    *  Create UMD Module with templates [for production]
    */
    browserify: {
      module: {
        options: {
          browserifyOptions: {
            standalone:'<%= config.moduleName %>',
            debug: true
          },
          transform: ['nunjucksify']
        },
        src: ['<%= config.srcFolder %>/**/*.js', '<%= config.srcFolder %>/templates/**/*.html'],
        dest: '<%= config.buildFolder %>/<%= config.moduleName %>.js',
      },
    }
  });

  /**
  *  Grunt module tasks
  */
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bower-task');

  /**
  *  Grunt task
  */
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('server', ['jshint','bower','browserify','connect:server','watch']);
  grunt.registerTask('build', ['jshint','bower','browserify','concat:dist','uglify']);



};