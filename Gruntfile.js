module.exports = function(grunt) {

  grunt.initConfig({

    config: {
      testPort: 3000,
      moduleName:'testModule',
      asyncModuleName:'asyncModule',
      buildFolder: 'build',
      srcFolder: 'src',
      testFolder: 'www-test'
    },
    
    pkg: grunt.file.readJSON('package.json'),

    /**
    *  Download bower files [for testing]
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
        files:{
          '<%= config.testFolder %>/public/vendors.js': ['vendor/**/jquery.js','vendor/**/underscore.js','vendor/**/backbone.js','vendor/**/*.js'],
          '<%= config.testFolder %>/public/holder.js': ['vendor/**/holder.js'],
        }
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
        options:{
           // the banner is inserted at the top of the output
           banner: '/*! <%= config.moduleName %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        },
        files: {
          '<%= config.buildFolder %>/<%= config.moduleName %>.min.js': ['<%= config.buildFolder %>/<%= config.moduleName %>.js'],
          '<%= config.buildFolder %>/<%= config.asyncModuleName %>.min.js': ['<%= config.buildFolder %>/<%= config.asyncModuleName %>.js'],
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
      files: ['<%= jshint.files %>', '<%= config.srcFolder %>/**/*', '<%= config.testFolder %>/**/*' ],
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
            standalone  : '<%= config.moduleName %>',
            debug       : true
          },
          transform: ['nunjucksify'],     
        },
        files:{
          '<%= config.buildFolder %>/<%= config.moduleName %>.js':['<%= config.srcFolder %>/<%= config.moduleName %>.js'],
          '<%= config.buildFolder %>/<%= config.asyncModuleName %>.js':['<%= config.srcFolder %>/<%= config.asyncModuleName %>.js'],
        }
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
  grunt.registerTask('server', ['jshint','bower','concat:dist','browserify','connect:server','watch']);
  grunt.registerTask('build', ['jshint','bower','concat:dist','browserify','uglify']);



};