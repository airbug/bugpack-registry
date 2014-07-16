/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack-registry may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Export('bugpack-registry.BugPackKey')

//@Require('Class')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('bugpack').context("*", function(bugpack) {

    //-------------------------------------------------------------------------------
    // BugPack
    //-------------------------------------------------------------------------------

    var Class   = bugpack.require('Class');
    var Obj     = bugpack.require('Obj');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @class
     * @extends {Obj}
     */
    var BugPackKey = Class.extend(Obj, {

        _name: "bugpack-registry.BugPackKey",


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

    bugpack.export('bugpack-registry.BugPackKey', BugPackKey);
});
