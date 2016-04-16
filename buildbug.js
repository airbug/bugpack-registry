/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack-registry may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug                = require("buildbug");


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject            = buildbug.buildProject;
var buildProperties         = buildbug.buildProperties;
var buildScript             = buildbug.buildScript;
var buildTarget             = buildbug.buildTarget;
var enableModule            = buildbug.enableModule;
var parallel                = buildbug.parallel;
var series                  = buildbug.series;
var targetTask              = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws                     = enableModule("aws");
var bugpack                 = enableModule('bugpack');
var bugunit                 = enableModule('bugunit');
var core                    = enableModule('core');
var lintbug                 = enableModule("lintbug");
var nodejs                  = enableModule('nodejs');
var uglifyjs                = enableModule("uglifyjs");


//-------------------------------------------------------------------------------
// Values
//-------------------------------------------------------------------------------

var name                    = "bugpack-registry";
var version                 = "0.1.7";
var dependencies            = {
    bugpack: "0.2.2"
};


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    name: name,
    version: version
});

buildProperties({
    node: {
        packageJson: {
            name: "{{name}}",
            version: "{{version}}",
            description: "Registry builder for the bugpack package loader",
            main: "./scripts/bugpack-registry-node.js",
            author: "Brian Neisler <brian@airbug.com>",
            dependencies: dependencies,
            repository: {
                type: "git",
                url: "https://github.com/airbug/bugpack.git"
            },
            bugs: {
                url: "https://github.com/airbug/bugpack/issues"
            },
            licenses: [
                {
                    type : "MIT",
                    url : "https://raw.githubusercontent.com/airbug/bugpack/master/LICENSE"
                }
            ]
        },
        sourcePaths: [
            "../buganno/libraries/buganno/js/src",
            "../bugcore/libraries/bugcore/js/src",
            "../bugfs/libraries/bugfs/js/src",
            "../bugmeta/libraries/bugmeta/js/src",
            "./libraries/bugpack-registry/js/src"
        ],
        scriptPaths: [
            "../buganno/libraries/buganno/js/scripts",
            "./projects/bugpack-registry-node/js/scripts"
        ],
        readmePath: "./README.md",
        unitTest: {
            packageJson: {
                name: "{{name}}-test",
                version: "{{version}}",
                main: "./scripts/bugpack-registry-node.js",
                dependencies: dependencies,
                scripts: {
                    test: "node ./test/scripts/bugunit-run.js"
                }
            },
            sourcePaths: [
                "../bugdouble/libraries/bugdouble/js/src",
                "../bugunit/libraries/bugunit/js/src",
                "../bugyarn/libraries/bugyarn/js/src"
            ],
            scriptPaths: [
                "../bugunit/libraries/bugunit/js/scripts"
            ],
            testPaths: [
                "../buganno/libraries/buganno/js/test",
                "../bugcore/libraries/bugcore/js/test",
                "../bugfs/libraries/bugfs/js/test",
                "../bugmeta/libraries/bugmeta/js/test",
                "./libraries/bugpack-registry/js/test"
            ]
        }
    },
    lint: {
        targetPaths: [
            "."
        ],
        ignorePatterns: [
            ".*\\.buildbug$",
            ".*\\.bugunit$",
            ".*\\.git$",
            ".*node_modules$"
        ]
    }
});


//-------------------------------------------------------------------------------
// BuildTargets
//-------------------------------------------------------------------------------


// Clean BuildTarget
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);


// Local BuildTarget
//-------------------------------------------------------------------------------

buildTarget("local").buildFlow(
    series([
        targetTask("clean"),
        targetTask('lint', {
            properties: {
                targetPaths: buildProject.getProperty("lint.targetPaths"),
                ignores: buildProject.getProperty("lint.ignorePatterns"),
                lintTasks: [
                    "cleanupExtraSpacingAtEndOfLines",
                    "ensureNewLineEnding",
                    "indentEqualSignsForPreClassVars",
                    "orderBugpackRequires",
                    "orderRequireAnnotations",
                    "updateCopyright"
                ]
            }
        }),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("node.packageJson"),
                        packagePaths: {
                            "./": [buildProject.getProperty("node.readmePath")],
                            "./lib": buildProject.getProperty("node.sourcePaths").concat(
                                buildProject.getProperty("node.unitTest.sourcePaths")
                            ),
                            "./scripts": buildProject.getProperty("node.scriptPaths").concat(
                                buildProject.getProperty("node.unitTest.scriptPaths")
                            ),
                            "./test": buildProject.getProperty("node.unitTest.testPaths")
                        }
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{local-bucket}}"
                    }
                })
            ])
        ])
    ])
).makeDefault();


// Prod BuildTarget
//-------------------------------------------------------------------------------

buildTarget("prod").buildFlow(
    series([
        targetTask("clean"),
        targetTask('lint', {
            properties: {
                targetPaths: buildProject.getProperty("lint.targetPaths"),
                ignores: buildProject.getProperty("lint.ignorePatterns"),
                lintTasks: [
                    "cleanupExtraSpacingAtEndOfLines",
                    "ensureNewLineEnding",
                    "indentEqualSignsForPreClassVars",
                    "orderBugpackRequires",
                    "orderRequireAnnotations",
                    "updateCopyright"
                ]
            }
        }),
        parallel([

            //Create test bugpack-registry package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("node.unitTest.packageJson"),
                        packagePaths: {
                            "./": [buildProject.getProperty("node.readmePath")],
                            "./lib": buildProject.getProperty("node.sourcePaths").concat(
                                buildProject.getProperty("node.unitTest.sourcePaths")
                            ),
                            "./scripts": buildProject.getProperty("node.scriptPaths").concat(
                                buildProject.getProperty("node.unitTest.scriptPaths")
                            ),
                            "./test": buildProject.getProperty("node.unitTest.testPaths")
                        }
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("node.unitTest.packageJson.name"),
                            buildProject.getProperty("node.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{node.unitTest.packageJson.name}}",
                        packageVersion: "{{node.unitTest.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("node.unitTest.packageJson.name"),
                            buildProject.getProperty("node.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath(),
                            checkCoverage: true
                        });
                    }
                })
            ]),

            // Create production bugpack-registry package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("node.packageJson"),
                        packagePaths: {
                            "./": [buildProject.getProperty("node.readmePath")],
                            "./lib": buildProject.getProperty("node.sourcePaths"),
                            "./scripts": buildProject.getProperty("node.scriptPaths")
                        }
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{prod-deploy-bucket}}"
                    }
                }),
                targetTask('npmConfigSet', {
                    properties: {
                        config: buildProject.getProperty("npmConfig")
                    }
                }),
                targetTask('npmAddUser'),
                targetTask('publishNodePackage', {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                })
            ])
        ])
    ])
);


//-------------------------------------------------------------------------------
// Build Scripts
//-------------------------------------------------------------------------------

buildScript({
    dependencies: [
        "bugcore",
        "bugflow",
        "bugfs"
    ],
    script: "./lintbug.js"
});
