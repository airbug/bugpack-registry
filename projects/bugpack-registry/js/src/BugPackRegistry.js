//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('bugpack')

//@Export('BugPackRegistry')

//@Require('Class')
//@Require('DependencyGraph')
//@Require('IObjectable')
//@Require('List')
//@Require('Map')
//@Require('Obj')
//@Require('Set')
//@Require('bugfs.BugFs')
//@Require('bugpack.BugPackKey')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class           = bugpack.require('Class');
var DependencyGraph = bugpack.require('DependencyGraph');
var IObjectable     = bugpack.require('IObjectable');
var List            = bugpack.require('List');
var Map             = bugpack.require('Map');
var Obj             = bugpack.require('Obj');
var Set             = bugpack.require('Set');
var BugFs           = bugpack.require('bugfs.BugFs');
var BugPackKey      = bugpack.require('bugpack.BugPackKey');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistry = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @constructs
     * @param {Path} registryRootPath
     */
    _constructor: function(registryRootPath) {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Map.<string, BugPackRegistryEntry>}
         */
        this.exportKeyToRegistryEntryMap        = new Map();

        /**
         * @private
         * @type {List.<BugPackRegistryEntry>}
         */
        this.registryEntries                    = new List();

        /**
         * @private
         * @type {Path}
         */
        this.registryRootPath                   = registryRootPath;

        /**
         * @private
         * @type {Map.<string, Set.<BugPackRegistryEntry>>}
         */
        this.packageKeyToRegistryEntrySetMap   = new Map();

        /**
         * @private
         * @type {Map.<string, BugPackRegistryEntry>}
         */
        this.sourceFilePathToRegistryEntryMap   = new Map();
    },


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {List.<BugPackRegistryEntry>)
     */
    getRegistryEntriesInDependentOrder: function() {
        var _this = this;
        var dependencyGraph = new DependencyGraph();
        this.registryEntries.forEach(function(bugPackRegistryEntry) {
            dependencyGraph.addNodeForValue(bugPackRegistryEntry);
        });
        this.registryEntries.forEach(function(bugPackRegistryEntry) {
            var requireSet = bugPackRegistryEntry.getRequireSet();
            requireSet.forEach(function(requireKey) {
                var bugPackKey = _this.generateBugPackKey(requireKey);
                if (bugPackKey.isWildCard()) {
                    var requiredBugPackEntrySet = _this.getEntrySetByPackageName(bugPackKey.getPackageName());
                    if (requiredBugPackEntrySet) {
                        requiredBugPackEntrySet.forEach(function(requiredRegistryEntry) {

                            //NOTE BRN: It is ok for files to require something they export. This way we can concat files together
                            // without them breaking. We simply ignore registry entries that require themselves.

                            if (!bugPackRegistryEntry.equals(requiredRegistryEntry)) {
                                dependencyGraph.addDependency(bugPackRegistryEntry, requiredRegistryEntry);
                            }
                        });
                    }
                } else {
                    var requiredRegistryEntry = _this.getEntryByKey(bugPackKey.getKey());

                    //NOTE BRN: It is ok for files to require something they export. This way we can concat files together
                    // without them breaking. We simply ignore registry entries that require themselves.

                    if (!bugPackRegistryEntry.equals(requiredRegistryEntry)) {
                        dependencyGraph.addDependency(bugPackRegistryEntry, requiredRegistryEntry);
                    }
                }
            });
        });
        return dependencyGraph.getValuesInDependentOrder();
    },

    /**
     * @return {List.<BugPackRegistryEntry>}
     */
    getRegistryEntries: function() {
        return this.registryEntries;
    },

    /**
     * @return {Path}
     */
    getRegistryRootPath: function() {
        return this.registryRootPath;
    },


    //-------------------------------------------------------------------------------
    // IObjectable Implementation
    //-------------------------------------------------------------------------------

    /**
     * @return {Object}
     */
    toObject: function() {
        var registryObject = {};
        this.registryEntries.forEach(function(registryEntry) {
            registryObject[registryEntry.getRelativePath()] = registryEntry.toObject();
        });
        return registryObject;
    },


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {BugPackRegistryEntry} bugPackRegistryEntry
     */
    addRegistryEntry: function(bugPackRegistryEntry) {
        var _this = this;
        if (!this.sourceFilePathToRegistryEntryMap.containsKey(bugPackRegistryEntry.getRelativePath())) {
            this.registryEntries.add(bugPackRegistryEntry);
            var exportSet = bugPackRegistryEntry.getExportSet();

            // NOTE BRN: export names are not required for exports. This can be useful when annotating files that are
            // loaded more like scripts.

            if (exportSet) {
                exportSet.forEach(function(exportKey) {
                    var bugPackKey = _this.generateBugPackKey(exportKey);
                    if (!_this.exportKeyToRegistryEntryMap.containsKey(bugPackKey.getKey())) {
                        _this.exportKeyToRegistryEntryMap.put(bugPackKey.getKey() , bugPackRegistryEntry);
                        var registryEntrySet = _this.packageKeyToRegistryEntrySetMap.get(bugPackKey.getPackageName());
                        if (!registryEntrySet) {
                            registryEntrySet = new Set();
                            _this.packageKeyToRegistryEntrySetMap.put(bugPackKey.getPackageName(), registryEntrySet);
                        }
                        registryEntrySet.add(bugPackRegistryEntry);
                    } else {
                        throw new Error("Registry already has a registry entry registered for export '" +
                            exportKey + "'");
                    }
                });
            }
            this.sourceFilePathToRegistryEntryMap.put(bugPackRegistryEntry.getRelativePath(), bugPackRegistryEntry);
        } else {
            throw new Error("The source file path '" + bugPackRegistryEntry.getRelativePath() + "' has already been registered");
        }
    },

    /**
     * @param {string} key
     * @return {BugPackRegistryEntry}
     */
    getEntryByKey: function(key) {
        return this.exportKeyToRegistryEntryMap.get(key);
    },

    /**
     * @param {string} packageName
     * @return {List.<BugPackRegistryEntry>}
     */
    getEntrySetByPackageName: function(packageName) {
        return this.packageKeyToRegistryEntrySetMap.get(packageName);
    },

    /**
     * @param {(string | Path)} sourceFilePath
     * @return {BugPackRegistryEntry}
     */
    getEntryBySourceFilePath: function(sourceFilePath) {
        var sourceFile = BugFs.path(sourceFilePath).getAbsolutePath();
        return this.sourceFilePathToRegistryEntryMap.get(sourceFile);
    },


    //-------------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {string} bugPackKeyString
     * @return {BugPackKey}
     */
    generateBugPackKey: function(bugPackKeyString) {
        return new BugPackKey(bugPackKeyString);
    }
});


//-------------------------------------------------------------------------------
// Interfaces
//-------------------------------------------------------------------------------

Class.implement(BugPackRegistry, IObjectable);


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('bugpack.BugPackRegistry', BugPackRegistry);
