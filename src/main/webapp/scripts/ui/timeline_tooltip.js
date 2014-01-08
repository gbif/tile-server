gbif.ui.model.Cat = Backbone.Model.extend({
  defaults: {
    selected: false
  }
});

gbif.ui.collection.Cats = Backbone.Collection.extend({
  model: gbif.ui.model.Cat
});

gbif.ui.model.TimelineTooltip = Backbone.Model.extend({
  defaults: {
    hidden: true
  }
});

gbif.ui.view.TimelineTooltip = Backbone.View.extend({
  className: 'timeline_tooltip',

  events: {
    "click li a ": "_onCatClick"
  },

  initialize: function() {
    _.bindAll( this, "toggle", "_toggle", "show", "hide", "_onCatClick");

    this.cats = new gbif.ui.collection.Cats();

    this.model = new gbif.ui.model.TimelineTooltip();

    this.model.bind("change:hidden", this._toggle);

    var template = $("#timeline_tooltip-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  _addCat: function(options) {
    var cat = new gbif.ui.model.Cat( options );

    this.cats.add(cat);

    var template = new gbif.core.Template({
      template: $("#timeline_tooltip_cat-template").html()
    });

    this.$cats.append(template.render( cat.toJSON() ));
  },

  addHandler: function(el) {
    this.$handler = $(el);
  },

  show: function() {
    this.model.set("hidden", false);
  },

  hide: function() {
    this.model.set("hidden", true);
  },

  toggle: function() {
    if(!this.model.get("hidden")) {
      this.model.set("hidden", true);
    } else {
      this.model.set("hidden", false);
    }
  },

  _toggle: function() {
    if(!this.model.get("hidden")) {
      var top  = this.$handler.offset().top - $(this.$el).height() - 10;
      var left = this.$handler.offset().left;

      $(this.$el).css({
        "left": left,
        "top": top
      });

      $(this.$el).fadeIn(150);
    } else {
      $(this.$el).fadeOut(150);
    }
  },

  _onCatClick: function(e) {
    e.preventDefault();

    var $link = $(e.target);

    $(".timeline_tooltip_link").removeClass("selected");

    if(!$link.hasClass("timeline_tooltip_link")) {
      $link = $link.closest(".timeline_tooltip_link");
    }

    $link.addClass("selected");

    this.hide();

    timeline.updateCat($link.attr("data-key"), $link.attr("data-title"));
  },

  render: function() {
    var self = this;

    this.$el.append(this.template.render( this.model.toJSON() ));
    
    this.$cats = this.$el.find("ul");

    // http://vizzuality.github.io/gbif/index.html?style=satellite
    var cat_ = getURLParameter("cat") || config.MAP.cat;

    _.each(cats, function(cat) {
      self._addCat({ key: cat['name'], title: cat['title'], selected: cat['name'] === cat_ });
    });

    return this.$el;
  }
});
