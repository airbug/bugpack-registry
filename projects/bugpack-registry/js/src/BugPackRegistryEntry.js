//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('bugpack')

//@Export('BugPackRegistryEntry')

//@Require('Class')
//@Require('IObjectable')
//@Require('Obj')
//@Require('Set')
//@Require('bugfs.BugFs')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class           = bugpack.require('Class');
var IObjectable     = bugpack.require('IObjectable');
var Obj             = bugpack.require('Obj');
var Set             = bugpack.require('Set');
var BugFs           = bugpack.require('bugfs.BugFs');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryEntry = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     *
     */
    _constructor: function(bugPackRegistry, relativePath) {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {boolean}
         */
        this.autoload           = false;

        /**
         * @private
         * @type {BugPackRegistry}
         */
        this.bugPackRegistry    = bugPackRegistry;

        /**
         * @private
         * @type {Set.<string>}
         */
        this.exportSet          = new Set();

        /**
         * @private
         * @type {Path}
         */
        this.relativePath       = relativePath;

        /**
         * @private
         * @type {Set.<string>}
         */
        this.requireSet        = new Set();
    },


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {boolean}
     */
    getAutoload: function() {
        return this.autoload;
    },

    /**
     * @param {boolean} autoload
     */
    setAutoload: function(autoload) {
        this.autoload = autoload;
    },

    /**
     * @return {Set.<string>}
     */
    getExportSet: function() {
        return this.exportSet;
    },

    /**
     * @return {Path}
     */
    getRelativePath: function() {
        return this.relativePath;
    },

    /**
     * @return {string}
     */
    getResolvedPath: function() {
        return BugFs.resolvePaths([this.bugPackRegistry.getRegistryRootPath(), this.relativePath]);
    },

    /**
     * @return {Set.<string>}
     */
    getRequireSet: function() {
        return this.requireSet;
    },


    //-------------------------------------------------------------------------------
    // IObjectable Implementation
    //-------------------------------------------------------------------------------

    /**
     * @return {Object}
     */
    toObject: function() {
        return {
            path: this.relativePath,
            exports: this.exportSet.toArray(),
            requires: this.requireSet.toArray(),
            autoload: this.autoload
        };
    },


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {(Array.<string> | Collection.<string>)} exports
     */
    addAllExports: function(exports) {
        this.exportSet.addAll(exports);
    },

    /**
     * @param {(Array.<string> | Collection.<string>)} requires
     */
    addAllRequires: function(requires) {
        this.requireSet.addAll(requires);
    }
});


//-------------------------------------------------------------------------------
// Interfaces
//-------------------------------------------------------------------------------

Class.implement(BugPackRegistryEntry, IObjectable);


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('bugpack.BugPackRegistryEntry', BugPackRegistryEntry);
