(function() {
  var gbif = window.gbif = {};

  window.gbif.config          = {};
  window.gbif.core            = {};
  window.gbif.ui              = {};
  window.gbif.ui.model        = {};
  window.gbif.ui.view         = {};
  window.gbif.ui.collection   = {};
  window.gbif.ui.common       = {};

  /**
  * global variables
  */
  window.JST = window.JST || {};

  gbif.init = function(ready) {
    // define a simple class
    var Class = gbif.Class = function() {};
    _.extend(Class.prototype, Backbone.Events);

    gbif._loadJST();
    window.gbif.god = new Backbone.Model();

    ready && ready();
  };
})();
