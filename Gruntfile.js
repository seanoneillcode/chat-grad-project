module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-mocha-test");

    var files = ["Gruntfile.js", "server.js", "server/**/*.js", "test/**/*.js", "public/**/*.js"];

    grunt.initConfig({
        jshint: {
            all: files,
            options: {
                jshintrc: true
            }
        },
        jscs: {
            all: files
        },
        mochaTest: {
            test: {
                src: ["test/**/*.js"]
            }
        }
    });

    grunt.registerTask("check", ["jshint", "jscs"]);
    grunt.registerTask("test", ["check", "mochaTest"]);
    grunt.registerTask("default", "test");
};
