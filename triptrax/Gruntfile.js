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
                    'jquery.min.js': 'jquery/dist/jquery.min.js',
                    'bootstrap.min.js': 'bootstrap-css/js/bootstrap.min.js',
                    'masonry.js': 'masonry/dist/masonry.pkgd.min.js'
                }
            },
            scss: {
                options: {
                    destPrefix: 'stylesheets'
                },
                files: {
                    'bootstrap.css': 'bootstrap-css/css/bootstrap.min.css',
                    'font-awesome.css': 'fontawesome/css/font-awesome.css'
                }
            },
            folders: {
                files: {
                    'fonts': ['fontawesome/fonts', 'bootstrap-css/fonts']
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
                    'js/libs/jquery.min.js',
                    'js/libs/bootstrap.min.js',
                    'js/libs/masonry.js',
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
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                //unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                devel: true,
                jquery: true,
                globals: {
                    modernizr: true,
                    getStyleProperty: true,
                    getSize: true
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
                    sassDir: ['sass'],
                    cssDir: ['stylesheets'],
                    fontsDir: ["fonts"],
                    environment: 'development'
                }
            },
            release: {
                options: {
                    sassDir: ['sass'],
                    cssDir: ['stylesheets'],
                    environment: 'production'
                }
            }
        },

        // concat stylesheets
        concat_css: {
            "assets/css/styles.css" : ["stylesheets/bootstrap.css", "stylesheets/font-awesome.css", "stylesheets/styles.css"]
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
            styles: {
                files: ["stylesheets/bootstrap.css", "stylesheets/font-awesome.css", "stylesheets/styles.css"],
                tasks: ['concat_css']
            },
            compass: {
                files: ['sass/*.{scss,sass}'],
                tasks: ['compass:dev']
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