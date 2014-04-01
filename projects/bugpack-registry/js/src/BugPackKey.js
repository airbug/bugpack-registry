//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('bugpack')

//@Export('BugPackKey')

//@Require('Class')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class           = bugpack.require('Class');
var Obj             = bugpack.require('Obj');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackKey = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @constructs
     * @param {string} key
     */
    _constructor: function(key) {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {string}
         */
        this.key = key;

        var keyParts = key.split('.');
        var packageName = ".";
        var exportName = keyParts.pop();
        if (keyParts.length > 0) {
            packageName = keyParts.join('.');
        }

        /**
         * @private
         * @type {string}
         */
        this.exportName = exportName;

        /**
         * @private
         * @type {String}
         */
        this.packageName = packageName;
    },


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------


    /**
     * @return {string}
     */
    getKey: function() {
        return this.key;
    },

    /**
     * @return {string}
     */
    getExportName: function() {
        return this.exportName;
    },

    /**
     * @return {string}
     */
    getPackageName: function() {
        return this.packageName;
    },

    /**
     * @return {boolean}
     */
    isWildCard: function() {
        return (this.exportName === "*");
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('bugpack.BugPackKey', BugPackKey);
