/*global module:false*/
module.exports = function(grunt) {

    var _initConfigs = {
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),

        // Banner license
        banner: '/*! <%= pkg.project %> - Build v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>)\n' +
            'Author: <%= pkg.author.name %>  */\n',

        // Pkg.name as filename
//        filename: '<%= pkg.name %>',
        filename: 'main',

        // Copy Bower packages
        bowercopy: {
            // JS
            js: {
                options: {
                    destPrefix: 'js/libs'
                },
                files: {
                    'zepto/zepto.js': 'zeptojs/src/zepto.js',
                    'zepto/event.js': 'zeptojs/src/event.js',
                    'zepto/ie.js': 'zeptojs/src/ie.js',
                    'bootstrap.min.js': 'bootstrap-css/js/bootstrap.min.js',
                    'underscore.js': 'underscore/underscore.js'
                }
            },
            scss: {
                options: {
                    destPrefix: 'stylesheets'
                },
                files: {
                    'scss/font-awesome': 'components-font-awesome/scss',
                    'bootstrap.css': 'bootstrap-css/css/bootstrap.css'
                }
            },
            folders: {
                files: {
                    'fonts': ['components-font-awesome/fonts', 'bootstrap-css/fonts']
                }
            }
        },

        shell: {
            jekyll: {
                command: 'rm -rf _site/*; jekyll build',
                stdout: true
            }
        },

        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true,
                separator: ';\n'
            },
            build: {
                src: [
                    'js/libs/zepto/zepto.js',
                    'js/libs/zepto/ie.js',
                    'js/libs/zepto/event.js',
                    'js/libs/underscore.js',
                    'js/libs/parse-1.2.18.js',
                    'js/libs/bootstrap.min.js',
                    'js/main.js'
                ],
                dest: 'assets/js/<%= filename %>.js'
            }
        },

        // Strip
        strip: {
            main : {
                src : '<%= concat.build.dest %>',
                dest : 'assets/js/<%= filename %>.js',
                options: {
                    nodes: ['console.log', 'console.time', 'console.timeEnd', 'console.dir']
                }
            }
        },

        // Uglify
        uglify: {
            options: {
                mangle: true,
                compress: true,
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= strip.main.dest %>',
                dest: '<%= strip.main.dest %>'
            }
        },

        // JShint (linter)
        jshint: {
            options: {
//                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                lastsemic: true,
                boss: true,
                eqnull: true,
                browser: true,
                devel: true,
                jquery: true,
                globals: {
                    modernizr: true,
                    Parse: true,
                    Backbone: true,
                    _: true
                }
            },
//            all: ['Gruntfile.js', 'js/*.js'],
            gruntfile: {
                files: {
                    src: 'Gruntfile.js'
                }
            },
            lib_test: {
                files: {
                    src: ['js/*.js']
                }
            }
        },

        // Copy assets outside of bower
//        copy: {
//            dev: {
//                files: [
//                    {expand: true, cwd: 'application/', src: ['img/**', 'fonts/**'], dest: 'builds/dev/assets/'},
//                    {expand: true, cwd: 'application/', src: ['themes/<%= pkg.channel %>/images/**'], dest: 'builds/dev/assets/css/img/', flatten: true},
//                    {expand: true, cwd: 'application/', src: ['ajax_mocks/**'], dest: 'builds/dev/'}
//                ]
//            },
//            release: {
//                files: [
//
//                ]
//            }
//        },

        // Compass stylesheets
        compass: {
            dev: {
                options: {
                    banner: false,
                    sassDir: ['stylesheets/scss'],
                    cssDir: ['stylesheets'],
                    fontsDir: ["fonts"],
                    environment: 'development'
                }
            },
            release: {
                options: {
                    sassDir: ['stylesheets/scss'],
                    cssDir: ['stylesheets'],
                    environment: 'production'
                }
            }
        },

        // concat stylesheets
        concat_css: {
            "assets/css/styles.css" : ["stylesheets/**.css"]
        },

        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.files.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.files.src %>',
                tasks: ['jshint', 'concat']
            },
            compass: {
                files: ['stylesheets/scss/*.{scss,sass}'],
                tasks: ['compass:dev']
            },
            styles: {
                files: ["stylesheets/bootstrap.css", "stylesheets/font-awesome.css", "stylesheets/styles.css"],
                tasks: ['concat_css']
            },
            jekyllSources: {
                files: [
                    '*.html', '*.yml', '*.md', 'assets/js/**.js', 'assets/css/**.css', '_posts/**',
                    'fonts/**', '_includes/**'
                ],
                tasks: ['shell:jekyll']
            },
            livereload: {
                options: { livereload: true },
                files: ["_site/assets/css/styles.css"]
            }
        },

        connect: {
            server: {
                options: {
                    base: '_site/',
                    port: 9009
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.server.options.port %>/'
            }
        }
    };

    // Project configuration.
    grunt.initConfig(_initConfigs);

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-bowercopy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-concat-css');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-strip');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');

    // Tasks
    grunt.registerTask('server', ['connect:server', 'open:server', 'watch']);
    grunt.registerTask('default', ['jshint', 'concat', 'compass:dev', 'concat_css']);
    grunt.registerTask('release', ['bowercopy','jshint', 'concat', 'strip', 'uglify', 'sass:release', 'template:release', 'copy:release', 'bump']);

};