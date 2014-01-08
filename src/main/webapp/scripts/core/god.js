gbif.ui.model.GOD = Backbone.Model.extend();

gbif.ui.view.GOD = gbif.core.View.extend({

  triggerCallbacks: function() {

    for (var i = 0; i<= this.items.length - 1; i++) {

      var item = this.items[i];

      try {

        item.callback && item.callback();

      } catch (e) { }

    }

    this.items = [];

  },

  add: function(item, callback) {

    this.items.push({ item: item, callback: callback });

  },

  initialize: function() {

    var that = this;

    $(document).on("click", function(e) {

      that.triggerCallbacks();

    });

    this.items = [];

  }

});


