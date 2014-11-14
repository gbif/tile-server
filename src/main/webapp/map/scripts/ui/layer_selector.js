gbif.ui.model.Layer = Backbone.Model.extend({
  defaults: {
    selected: false
  }
});

gbif.ui.collection.Layers = Backbone.Collection.extend({
  model: gbif.ui.model.Layer
});

gbif.ui.model.LayerSelector = Backbone.Model.extend({
  defaults: {
    closed: true
  }
});

gbif.ui.view.LayerSelector = Backbone.View.extend({
  className: 'layer_selector selector',

  events: {
    "click li a": "_onLayerClick",
  },

  initialize: function() {
    var self = this;

    _.bindAll(this, "_toggleOpen");

    this.options = _.extend(this.options, this.defaults);

    this.layers = new gbif.ui.collection.Layers();

    // layers are defined in helpers
    _.each(layers, function(layer) {
      self.layers.add(new gbif.ui.model.Layer(layer['name'] === config.MAP.layer ? _.extend(layer, { selected: true }) : layer));
    });

    this.selectedLayer = this.layers.find(function(layer) { return layer.get("selected"); });

    this.model = new gbif.ui.model.LayerSelector();

    this.model.bind("change:closed", this._toggleOpen);

    var template = $("#layer_selector-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  _addLayers: function() {
    var self = this;

    var template = new gbif.core.Template({
      template: $("#layer-template").html()
    });

    this.$layers.empty();
    this.layers.each(function(layer) {
      layer.set("thumbnail", self._getThumbnail(layer));
      self.$layers.append(template.render( layer.toJSON() ));
    });
  },

  _getThumbnail: function(layer) {
    var url = layer.get("url");

    return url.replace(/\{s\}/g, "a")
      .replace(/\{x\}/g, "0")
      .replace(/\{y\}/g, "0")
      .replace(/\{z\}/g, "0");
  },

  _addSelectedLayer: function() {
    var template = new gbif.core.Template({
      template: $("#layer-template").html()
    });

    this.$selected_layer.empty();
    
    this.selectedLayer.set("thumbnail", this._getThumbnail(this.selectedLayer));
    this.$selected_layer.append(template.render( this.selectedLayer.toJSON() ));
  },

  _toggleOpen: function() {
    var self = this;

    if(this.model.get("closed")) {
      this.$el.addClass("closed");

      this.$layers.animate({
        opacity: 0,
        width: 0
      }, 50, function() {
        self.$layers.hide();
        self.$selected_layer.fadeIn(150);
      });
    } else {
      this.$el.removeClass("closed");

      this.$selected_layer.fadeOut(150, function() {
        self.$layers.show();
        self.$layers.animate({
          opacity: 1,
          width: 32 * self.layers.length + 5 * (self.layers.length - 2) + 8
        }, 50);
      });
    }
  },

  _onLayerClick: function(e) {
    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    var map = this.options.map,
        $li  = $(e.target).closest("li"),
        name = $li.attr("id");

    if(this.selectedLayer.get("name") === name) {
      if($li.parent().hasClass("selected_layer")) {
        this.open();
      } else {
        this.close();
      }

      return;
    }

    map.attributionControl.removeAttribution(this.selectedLayer.get("attribution"));

    var layer = this.layers.find(function(layer) { return name === layer.get("name"); });
    this.selectedLayer.set("selected", false);
    layer.set("selected", true);
    this.selectedLayer = layer;

    if(config.LAYERTYPE === 'png') {
      mainLayer.setStyle(layers[this.selectedLayer.get("name")]['png-render-style']);
    }

    baseMap.setUrl(this.selectedLayer.get("url"));
    map.attributionControl.addAttribution(this.selectedLayer.get("attribution"));

    this._addLayers();
    this._addSelectedLayer();

    this.close();

    var iframeUrl = $.param(
      _.extend(config.MAP, { layer: this.selectedLayer.get("name") })
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

    this.$layers         = this.$el.find(".layers");
    this.$selected_layer = this.$el.find(".selected_layer");

    this._addLayers();
    this._addSelectedLayer();
    this._toggleOpen();

    return this.$el;
  }
});
