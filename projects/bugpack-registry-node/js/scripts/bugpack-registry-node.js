/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack-registry may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Script
//-------------------------------------------------------------------------------

var bugpackApi              = require("bugpack");
var bugpack                 = bugpackApi.loadContextSync(module);
bugpack.loadExportSync("bugpack-registry.BugPackRegistryBuilder");
var BugPackRegistryBuilder  = bugpack.require("bugpack-registry.BugPackRegistryBuilder");


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistryBuilder;
