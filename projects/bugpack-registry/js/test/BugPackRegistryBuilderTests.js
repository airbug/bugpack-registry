//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@TestFile

//@Require('Class')
//@Require('bugpack.BugPackRegistryBuilder')
//@Require('bugmeta.BugMeta')
//@Require('bugunit-annotate.TestAnnotation')
//@Require('bugyarn.BugYarn')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack                 = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class                   = bugpack.require('Class');
var BugPackRegistryBuilder  = bugpack.require('bugpack.BugPackRegistryBuilder');
var BugMeta                 = bugpack.require('bugmeta.BugMeta');
var TestAnnotation          = bugpack.require('bugunit-annotate.TestAnnotation');
var BugYarn                 = bugpack.require('bugyarn.BugYarn');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var bugmeta                 = BugMeta.context();
var bugyarn                 = BugYarn.context();
var test                    = TestAnnotation.test;


//-------------------------------------------------------------------------------
// BugYarn
//-------------------------------------------------------------------------------

bugyarn.registerWeaver("testBugPackRegistryBuilder", function(yarn) {
    return new BugPackRegistryBuilder();
});

bugyarn.registerWinder("setupTestBugPackRegistryBuilder", function(yarn) {
    yarn.wind({
        bugPackRegistryBuilder: new BugPackRegistryBuilder()
    });
});


//-------------------------------------------------------------------------------
// Declare Tests
//-------------------------------------------------------------------------------

/**
 * This tests...
 * 1) Instantiating a BugPackRegistryBuilder class with no parameters
 */
var bugPackRegistryBuilderInstantiationTest = {

    // Setup Test
    //-------------------------------------------------------------------------------

    setup: function() {
        this.testBugPackRegistryBuilder = new BugPackRegistryBuilder();
    },


    // Run Test
    //-------------------------------------------------------------------------------

    test: function(test) {
        test.assertTrue(Class.doesExtend(this.testBugPackRegistryBuilder, BugPackRegistryBuilder),
            "Assert instance of BugPackRegistryBuilder");
    }
};

/**
 * This tests...
 * 1) the #findAutoload method of BugPackRegistryBuilder
 */
var bugPackRegistryBuilderFindAutoloadSuccessTest = {

    // Setup Test
    //-------------------------------------------------------------------------------

    setup: function() {
        var yarn = bugyarn.yarn(this);
        yarn.spin([
            "setupTestBugPackRegistryBuilder",
            "setupTestAnnotationRegistry"
        ]);
        var autoloadAnnotation = yarn.weave("testBugAnnotation", ["Autoload", []]);
        this.annotationRegistry.addAnnotation(autoloadAnnotation);
    },


    // Run Test
    //-------------------------------------------------------------------------------

    test: function(test) {
        var result = this.bugPackRegistryBuilder.findAutoload(this.annotationRegistry);
        test.assertEqual(result, true,
            "Assert that Autoload annotation was found");
    }
};


//-------------------------------------------------------------------------------
// BugMeta
//-------------------------------------------------------------------------------

bugmeta.annotate(bugPackRegistryBuilderInstantiationTest).with(
    test().name("BugPackRegistryBuilder - instantiation test")
);
bugmeta.annotate(bugPackRegistryBuilderFindAutoloadSuccessTest).with(
    test().name("BugPackRegistryBuilder - #findAutoload success test")
);
