gbif.ui.view.AnalysisButton = Backbone.View.extend({
  className: 'analysis_control selector',

  events: {
    'click a#analysis_control': '_onClickButton'
  },

  initialize: function() {
    var template = $("#analysis_control-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  enable: function() {
    var self = this;

    this.$el.find("i").addClass("active");
    this.$el.find(".analysis span").text("Cancel");

    setTimeout(function() {
      self.$el.find(".analysis").animate({
        'width': 50
      }, 150);

      self.$el.find(".analysis_explanation p").animate({
        'margin-right': 67
      }, 150);
    }, 150);
  },

  disable: function() {
    var self = this;

    this.$el.find(".analysis").animate({
      'width': 100
    }, 150);

    this.$el.find(".analysis_explanation p").animate({
      'margin-right': -256
    }, 150, function() {
      setTimeout(function() {
        self.$el.find("i").removeClass("active");
        self.$el.find(".analysis span").text("Report an error");
      }, 150);
    });
  },

  _onClickButton: function(e) {
    e.preventDefault();

    if(!this.model.get("active")) {
      analysis.startAnalysis();
    } else {
      analysis.stopAnalysis();
    }
  },

  render: function() {
    this.$el.html(this.template.render( this.model.toJSON() ));

    this.$explanation = this.$el.find(".analysis_explanation");

    return this.$el;
  }
});


gbif.ui.model.Analysis = Backbone.Model.extend({
  defaults: {
    active: false
  }
});

gbif.ui.view.Analysis = gbif.core.View.extend({
  initialize: function() {
    this.model = new gbif.ui.model.Analysis();

    _.bindAll(this, "_toggleAnalysis", "_onOverlayComplete");

    // bindings
    this.model.bind("change:active", this._toggleAnalysis);

    this.map = this.options.map;
  },

  startAnalysis: function() {
    this.model.set("active", true);

    this._setupAnalysis();
  },

  stopAnalysis: function() {
    this.model.set("active", false);

    this._clearAnalysis();
  },

  _toggleAnalysis: function() {
    if(this.model.get("active")) {
      this.button.enable();
    } else {
      this.button.disable();
    }
  },

  _setupAnalysis: function() {
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    this.map.on('draw:created', this._onOverlayComplete);
    this.drawingManager = new L.Draw.Polygon(map, config.ANALYSIS_OVERLAY_STYLE);
    this.drawingManager.enable();
  },

  _clearAnalysis: function() {
    this.map.removeLayer(this.drawnItems);
    this.drawnItems = null;

    this.map.off('draw:created');

    this.drawingManager.disable();
    this.drawingManager = null;
  },

  _onOverlayComplete: function(e) {
    this.drawnItems.addLayer(e.layer);

    this.selectedShape = {
      "type": e.layerType,
      "coordinates": e.layer._latlngs
    };

    this.dialog.show();
  },

  render: function() {
    this.button = new gbif.ui.view.AnalysisButton({
      model: this.model
    });

    this.dialog = new gbif.ui.view.AnalysisSubscribe();

    $(".selectors").append(this.button.render());
    $("#wrapper").append(this.dialog.render());
  }
});


gbif.ui.view.AnalysisSubscribe = Backbone.View.extend({
  className: 'analysis_subscribe',

  events: {
    "keyup textarea": "_onKeyPress",
    "click .send":    "_send",
    'click .cancel':   "hide"
  },

  initialize: function() {
    _.bindAll(this, "_onKeyUp");

    this.$backdrop = $(".backdrop");

    var template = $("#analysis_subscribe-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  show: function() {
    this.$backdrop.fadeIn(250);
    this.$el.fadeIn(250);

    $(document).on("keyup", this._onKeyUp);
  },

  hide: function() {
    this.$el.fadeOut(250);
    this.$backdrop.fadeOut(250);

    analysis.stopAnalysis();

    $(document).off("keyup");
  },

  _onKeyUp: function(e) {
    if (e.which == 27) this._onEscKey(e);
  },

  _onEscKey: function(e) {
    e.preventDefault();

    this.hide();
  },

  _onKeyPress: function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.keyCode == 13) {
      this._send(e);
    }
  },

  _send: function(e) {
    var self = this;

    e.preventDefault();
    e.stopPropagation();

    $.ajax({
      type: this.$form.attr('method'),
      url: this.$form.attr('action'),
      data: this.$form.serialize()
    }).done(function() {
      // success

      self.hide();
    }).fail(function() {
      // error
      alert(JSON.stringify(analysis.selectedShape));
    });
  },

  render: function() {
    this.$el.append(this.template.render());

    this.$form = this.$el.find("form");

    return this.$el;
  }
});
