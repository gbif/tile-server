gbif.ui.model.Resolution = Backbone.Model.extend({
  defaults: {
    selected: false
  }
});

gbif.ui.collection.Resolutions = Backbone.Collection.extend({
  model: gbif.ui.model.Resolution
});

gbif.ui.model.ResolutionSelector = Backbone.Model.extend({
  defaults: {
    closed: true
  }
});

gbif.ui.view.ResolutionSelector = Backbone.View.extend({
  className: 'resolution_selector',

  events: {
    "click li a": "_onResolutionClick",
  },

  initialize: function() {
    var self = this;

    _.bindAll( this, "_toggleOpen");

    this.options = _.extend(this.options, this.defaults);

    this.resolutions = new gbif.ui.collection.Resolutions();

    // resolutions are defined in helpers
    _.each(resolutions, function(resolution) {
      self.resolutions.add(new gbif.ui.model.Resolution(resolution['resolution'] === config.MAP.resolution ? _.extend(resolution, { selected: true }) : resolution));
    });

    this.selectedResolution = this.resolutions.find(function(resolution) { return resolution.get("selected"); });

    this.model = new gbif.ui.model.ResolutionSelector();

    this.model.bind("change:closed", this._toggleOpen);

    var template = $("#resolution_selector-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  _addResolutions: function() {
    var self = this;

    var template = new gbif.core.Template({
      template: $("#resolution-template").html()
    });

    this.$resolutions.empty();

    this.resolutions.each(function(resolution) {
      self.$resolutions.append(template.render( resolution.toJSON() ));
    });
  },

  _addSelectedResolution: function() {
    var template = new gbif.core.Template({
      template: $("#resolution-template").html()
    });

    this.$selected_resolution.empty();

    this.$selected_resolution.append(template.render( this.selectedResolution.toJSON() ));
  },

  _toggleOpen: function() {
    var self = this;

    if(this.model.get("closed")) {
      this.$el.addClass("closed");

      this.$resolutions.animate({
        opacity: 0,
        width: 0
      }, 50, function() {
        self.$resolutions.hide();
        self.$selected_resolution.fadeIn(150);
      });
    } else {
      this.$el.removeClass("closed");

      this.$selected_resolution.fadeOut(150, function() {
        self.$resolutions.show();
        self.$resolutions.animate({
          opacity: 1,
          width: 32 * self.resolutions.length + 5 * (self.resolutions.length - 2) + 8
        }, 50);
      });
    }
  },

  _onResolutionClick: function(e) {
    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    var $li  = $(e.target).closest("li"),
        name = $li.attr("id");

    if(this.selectedResolution.get("name") === name) {
      if($li.parent().hasClass("selected_resolution")) {
        this.open();
      } else {
        this.close();
      }

      return;
    }

    var resolution = this.resolutions.find(function(resolution) { return name === resolution.get("name"); });
    this.selectedResolution.set("selected", false);
    resolution.set("selected", true);
    this.selectedResolution = resolution;

    // TODO: implement setResolution in Torque
    // TODO: add cartoCSS for Torque styles
    if(config.LAYERTYPE === 'png') {
      mainLayer.setResolution(this.selectedResolution.get("resolution"));
    }

    this._addResolutions();
    this._addSelectedResolution();

    this.close();

    var iframeUrl = $.param(
      _.extend(config.MAP, { resolution: this.selectedResolution.get("name") })
    );

    parent.postMessage({
      origin: window.name,
      url: iframeUrl
    }, '*');
  },

  open: function() {
    this.model.set("closed", false);
  },

  close: function() {
    this.model.set("closed", true);
  },

  render: function() {
    this.$el.append(this.template.render( this.model.toJSON() ));

    this.$resolutions         = this.$el.find(".resolutions");
    this.$selected_resolution = this.$el.find(".selected_resolution");

    this._addResolutions();
    this._addSelectedResolution();
    this._toggleOpen();

    return this.$el;
  }
});
