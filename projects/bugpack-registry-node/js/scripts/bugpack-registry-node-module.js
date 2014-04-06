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
