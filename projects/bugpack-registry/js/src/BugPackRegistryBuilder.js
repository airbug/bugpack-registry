//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('bugpack')

//@Export('BugPackRegistryBuilder')

//@Require('Class')
//@Require('List')
//@Require('Map')
//@Require('Obj')
//@Require('Set')
//@Require('buganno.AnnotationRegistryLibraryBuilder')
//@Require('bugflow.BugFlow')
//@Require('bugfs.BugFs')
//@Require('bugfs.FileFinder')
//@Require('bugpack.BugPackRegistry')
//@Require('bugpack.BugPackRegistryEntry')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack                             = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class                               = bugpack.require('Class');
var List                                = bugpack.require('List');
var Map                                 = bugpack.require('Map');
var Obj                                 = bugpack.require('Obj');
var Set                                 = bugpack.require('Set');
var AnnotationRegistryLibraryBuilder    = bugpack.require('buganno.AnnotationRegistryLibraryBuilder');
var BugFlow                             = bugpack.require('bugflow.BugFlow');
var BugFs                               = bugpack.require('bugfs.BugFs');
var FileFinder                          = bugpack.require('bugfs.FileFinder');
var BugPackRegistry                     = bugpack.require('bugpack.BugPackRegistry');
var BugPackRegistryEntry                = bugpack.require('bugpack.BugPackRegistryEntry');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $series             = BugFlow.$series;
var $task               = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryBuilder = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @constructs
     */
    _constructor: function() {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {AnnotationRegistryLibraryBuilder}
         */
        this.annotationRegistryLibraryBuilder = new AnnotationRegistryLibraryBuilder();
    },


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {(string | Path)} registryRoot
     * @param {List.<(string | RegExp)>} ignorePatterns
     * @param {function(Error, BugPackRegistry=)} callback
     */
    build: function(registryRoot, ignorePatterns, callback) {
        var _this               = this;
        var registryRootPath    = BugFs.path(registryRoot);
        var bugPackRegistry     = null;
        var fileFinder          = new FileFinder([".*\\.js"], ignorePatterns);
        var filePaths           = null;
        $series([
            $task(function(flow) {
                fileFinder.scan([registryRootPath], function(error, _filePaths) {
                    if (!error) {
                        filePaths = _filePaths;
                    }
                    flow.complete(error);
                });
            }),
            $task(function(flow) {
                _this.annotationRegistryLibraryBuilder.build(filePaths, function(error, annotationRegistryLibrary) {
                    if (!error) {
                        bugPackRegistry = _this.generateBugPackRegistry(registryRootPath, annotationRegistryLibrary);
                    }
                    flow.complete(error);
                });
            })
        ]).execute(function(error) {
            if (!error) {
                callback(null, bugPackRegistry);
            } else {
                callback(error);
            }
        });
    },


    //-------------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {AnnotationRegistry} annotationRegistry
     * @return {boolean}
     */
    findAutoload: function(annotationRegistry) {
        var annotationList = annotationRegistry.getAnnotationList();
        for (var i = 0, size = annotationList.getCount(); i < size; i++) {
            var annotation = annotationList.getAt(i);
            var type = annotation.getAnnotationType();
            if (type === "Autoload") {
                return true;
            }
        }
        return false;
    },

    /**
     * @private
     * @param {AnnotationRegistry} annotationRegistry
     * @return {Set.<string>}
     */
    findExportSet: function(annotationRegistry) {
        var exportSet = new Set();
        annotationRegistry.getAnnotationList().forEach(function(annotation) {
            var type = annotation.getAnnotationType();
            var argumentList = annotation.getArgumentList();
            if (type === 'Export') {
                var exportName = argumentList.getAt(0);
                exportSet.add(exportName);
            }
        });
        return exportSet;
    },

    /**
     * @private
     * @param {AnnotationRegistry} annotationRegistry
     * @return {Set.<string>}
     */
    findRequireSet: function(annotationRegistry) {
        var requireSet = new Set();
        annotationRegistry.getAnnotationList().forEach(function(annotation) {
            var type = annotation.getAnnotationType();
            var argumentList = annotation.getArgumentList();
            if (type === 'Require') {
                var requireName = argumentList.getAt(0);
                requireSet.add(requireName);
            }
        });
        return requireSet;
    },

    /**
     * @private
     * @param {Path} registryRootPath
     * @param {AnnotationRegistryLibrary} annotationRegistryLibrary
     * @return {BugPackRegistry}
     */
    generateBugPackRegistry: function(registryRootPath, annotationRegistryLibrary) {
        var _this = this;
        var bugPackRegistry = new BugPackRegistry(registryRootPath);
        annotationRegistryLibrary.getAnnotationRegistryList().forEach(function(annotationRegistry) {
            _this.generateBugPackRegistryEntry(bugPackRegistry, annotationRegistry);
        });

        return bugPackRegistry;
    },

    /**
     * @private
     * @param {BugPackRegistry} bugPackRegistry
     * @param {AnnotationRegistry} annotationRegistry
     */
    generateBugPackRegistryEntry: function(bugPackRegistry, annotationRegistry) {
        var bugPackRegistryEntry = new BugPackRegistryEntry(bugPackRegistry, 
            BugFs.relativePath(bugPackRegistry.getRegistryRootPath(), annotationRegistry.getFilePath()));
        var exportSet   = this.findExportSet(annotationRegistry);
        var requireSet  = this.findRequireSet(annotationRegistry);
        var autoload    = this.findAutoload(annotationRegistry);
        bugPackRegistryEntry.addAllExports(exportSet);
        bugPackRegistryEntry.addAllRequires(requireSet);
        bugPackRegistryEntry.setAutoload(autoload);
        bugPackRegistry.addRegistryEntry(bugPackRegistryEntry);
    }
});


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} registryRoot
 * @param {Array.<(string | RegExp)>} ignorePatterns
 * @param {function(Error, BugPackRegistry)} callback
 */
BugPackRegistryBuilder.buildRegistry = function(registryRoot, ignorePatterns, callback) {
    var registryBuilder = new BugPackRegistryBuilder();
    registryBuilder.build(registryRoot, ignorePatterns, callback);
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('bugpack.BugPackRegistryBuilder', BugPackRegistryBuilder);
