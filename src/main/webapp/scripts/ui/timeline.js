gbif.ui.view.TimelineButton = Backbone.View.extend({
  className: 'timeline_control',

  events: {
    'click .fullscreen': '_onClickButton'
  },

  initialize: function() {
    var template = $("#timeline_control-template").html();

    this.template = new gbif.core.Template({
      template: template
    });
  },

  _onClickButton: function(e) {
    e.preventDefault();

    timeline.toggle();
  },

  render: function() {
    this.$el.html(this.template.render( this.model.toJSON() ));
    return this.$el;
  }
});

gbif.ui.model.Timeline = Backbone.Model.extend({
  defaults: {
    collapsed: true,
    left_year: "no",
    right_year: 2020,
    records: 0
  }
});

gbif.ui.view.Timeline = Backbone.View.extend({
  className: "timeline collapsed",

  events: {
    "click .action":      "_onClickAction",
    "click .year":        "_onClickYear",
    "click .hamburger a": "_onClickHamburger"
  },

  initialize: function() {
    var self = this;

    _.bindAll(this, "_onStartDrag", "_onDrag", "_onStopDrag", "_onChangeCollapsed", "_onChangeCurrentCat", "_onHandleAdjusted");

    this.cat = (this.options && this.options.cat) || config.MAP.cat;

    this.model = new gbif.ui.model.Timeline();

    this.model.set("current_cat", this.cat);
    this.model.set("current_title", cats[this.cat]['title']);

    // bindings
    this.model.bind("change:collapsed", this._onChangeCollapsed);
    this.model.bind("change:current_cat", this._onChangeCurrentCat);

    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
      if(self.model.get("collapsed")) {
        self.model.set("collapsed", false);
      } else {
        self.model.set("collapsed", true);
      }
    });

    // defaults
    this.grid_x = 37;

    var template = $("#timeline-template").html();

    this.template = new gbif.core.Template({
      template: template
    });

    this.render();

    this.$wrapper = $("#wrapper");

    this.button = new gbif.ui.view.TimelineButton({
      model: this.model
    });

    this.timeline_tooltip = new gbif.ui.view.TimelineTooltip();

    this.$wrapper.append(this.button.render());
    this.$wrapper.append(this.timeline_tooltip.render());

    this._init();
  },

  expand: function() {
    this.model.set("collapsed", false);
  },

  collapse: function() {
    this.model.set("collapsed", true);
  },

  toggle: function() {
    //fullscreen
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement && !document.webkitFullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  },

  _onChangeCollapsed: function() {
    var margin = 10,
        margin_bottom = 25,
        margin_expanded = 40;

    if(this.model.get("collapsed")) {
      $(this.$el).animate({
        'bottom': margin_bottom,
        'left': margin,
        'height': '44px'
      }, 150).addClass("collapsed");

      $(this.$zoom_control).animate({
        'margin-top': margin,
        'margin-left': margin
      }, 150);

      $(this.$timeline_control).animate({
        'top': margin,
        'left': margin * 2 + 75
      }, 150);

      $(this.$control_top_right).animate({
        'top': margin,
        'right': margin
      }, 150);

      $(this.$layer_selector_control).animate({
        'top': 38 + margin * 2,
        'right': margin
      }, 150);
    } else {
      if(typeof cats[this.model.get("current_cat")]['years'] != 'undefined') {
        $(this.$el).animate({
          'bottom': margin_expanded,
          'left': margin_expanded,
          'height': '150px'
        }, 150).removeClass("collapsed");
      } else {
        $(this.$el).animate({
          'bottom': margin_expanded,
          'left': margin_expanded,
        }, 150);
      }

      $(this.$zoom_control).animate({
        'margin-top': margin_expanded,
        'margin-left': margin_expanded
      }, 150);

      $(this.$timeline_control).animate({
        'top': margin_expanded,
        'left': margin_expanded + 75 + margin
      }, 150);

      $(this.$layer_selector_control).animate({
        'top': margin_expanded + margin + 38,
        'right': margin_expanded
      }, 150);

      $(this.$control_top_right).animate({
        'top': margin_expanded,
        'right': margin_expanded
      }, 150);
    }
  },

  _onStartDrag: function(e) {
    this.dragging = true;

    this.$current_drag = $(e.target);
    this.current_drag_side = this.$current_drag.hasClass("left") ? "left" : "right";

    this.$tipsy.fadeIn(50);
  },

  _onDrag: function() {
    this.dragging = true;

    this.model.set("left_handle",  this.$left_handle.position().left,  { silent: true });
    this.model.set("right_handle", this.$right_handle.position().left, { silent: true });

    var current_handle_pos = this.$current_drag.position().left;

    this._updateDate(current_handle_pos, this.$current_drag.offset(), this.$current_drag.hasClass("ui-draggable-dragging"));

    this.$range.find("div").css({ left: this.model.get("left_handle"), width: this.model.get("right_handle") - this.model.get("left_handle") });
    if(this.current_drag_side === 'left' && current_handle_pos > this.model.get("right_handle") - this.grid_x) {
      this.fixPosition = "left";
      return false;
    } else if(this.current_drag_side === 'right' && current_handle_pos < this.model.get("left_handle") + this.grid_x) {
      this.fixPosition = "right";
      return false;
    }
  },

  _updateDate: function(x, offset, drag) {
    var date = 1900;

    if(x === 0) { // hardcode no-date
      date = "NO DATE";
    } else if(x === this.grid_x) { // hardcode pre-date
      date = "PRE";
    } else if(x === this.grid_x * 14) { // hardcode last year :(
      date = 2020;
    } else {
      _.find(this.years, function(y) {
        if(x >= y[0]) {
          date = y[1];
          return;
        }
      });
    }

    if(drag) {
      this.$tipsy.css({
        left: offset.left - 15,
        top: offset.top - 37
      });
    } else {
      this.$tipsy.css({
        left: offset.left - 17,
        top: offset.top - 39
      })
    }

    this.$tipsy.find("span").html(date);

    this.$tipsy.show();
  },

  _onStopDrag: function() {
    var self = this;

    this.dragging = false;

    if (this.fixPosition) {
      if      (this.fixPosition === 'left')  this.model.set("left_handle",  this.model.get("right_handle") - this.grid_x);
      else if (this.fixPosition === 'right') this.model.set("right_handle", this.model.get("left_handle")  + this.grid_x);

      this.fixPosition = null;
    }

    setTimeout(function(){ self.$tipsy.fadeOut(150); }, 2000)

    this._adjustHandlePosition();
  },

  _adjustHandlePosition: function() {
    var self = this;

    if(this.current_drag_side === 'left') {
      this.$left_handle.animate({ left: this.model.get("left_handle") }, 150, self._onHandleAdjusted);
    } else {
      this.$right_handle.animate({ left: this.model.get("right_handle") }, 150, self._onHandleAdjusted);
    }
  },

  _adjustBothHandles: function() {
    this.$left_handle.animate({ left: this.model.get("left_handle") }, 150);
    this.$right_handle.animate({ left: this.model.get("right_handle") }, 150);

    this._onHandleAdjusted();
  },

  _onHandleAdjusted: function() {
    var self = this;

    svg.selectAll(".bar")
      .data(this.data)
      .style("fill", function(d) {
        var x = parseInt($(this).attr("x"), 10) + (self.grid_x * 2);

        if(x >= self.model.get("left_handle") && x < self.model.get("right_handle")) {
          return "#85C1F9";
        } else {
          return "#e5e5e5";
        }
      });

    var l = this.model.get("left_handle");
    var r = this.model.get("right_handle");

    if(this.$current_drag) {
      this._updateDate(this.current_drag_side === 'left' ? l : r, this.$current_drag.offset(), this.$current_drag.is(":hover"));
    }

    var cat_array = [],
        key_array = [],
        nums_array = 0;

    this.$range.find("div").css({ left: l, width: r - l });

    _.find(this.years, function(y) {
      if(l <= y[0] && r > y[0]) {
        cat_array.push(y[1]);
      }

      if(l === 0) {
        self.model.set("left_year", "no date"); // hardcode no-date
      } else if(l === self.grid_x) {
        self.model.set("left_year", "pre"); // hardcode pre-date
      } else if(l === y[0]) {
        self.model.set("left_year", y[1]);
      }

      if(r === y[0]) {
        self.model.set("right_year", y[1]);
      } else if(r === self.grid_x) {
        self.model.set("right_year", "pre"); // hardcode pre-date
      } else if(r === self.grid_x * 14) {
        self.model.set("right_year", 2020); // hardcode last year :(
      }
    });

    if(l === 0) {
      cat_array.push("no");
      cat_array.push("pre");
    } else if(l === this.grid_x) {
      cat_array.push("pre");
    }

    for(var i = 0; i < cat_array.length; i++) {
      if(Array.isArray(cats[this.model.get("current_cat")]['years'][cat_array[i]])) {
        for(var j = 0; j < cats[this.model.get("current_cat")]['years'][cat_array[i]].length; j++) {
          var key = cats[this.model.get("current_cat")]['years'][cat_array[i]][j];
          key_array.push(key);
          nums_array += aggr_data[key];
        }
      } else {
        var key = cats[this.model.get("current_cat")]['years'][cat_array[i]];
        nums_array += aggr_data[key];
        key_array.push(key);
      }
    }
    this.model.set("records", nums_array);

    this._updateLegendDesc();

		mainLayer.setKey(key_array);
		
    var iframeUrl = $.param(config.MAP);

		// construct the year (where possible) for the search
		if ("no date" == self.model.get("left_year") || "no date" == self.model.get("right_year")) {
		  // if no date is chosen, we can't add a search at all
		  config.SEARCH = _.omit(config.SEARCH, "YEAR");
		} else {
		  // pre 1900 needs a * in the search URL
		  var min = (self.model.get("left_year") == "pre") ? "*" : self.model.get("left_year");
		  var max = (self.model.get("right_year") == "pre") ? "*" : self.model.get("right_year");
		  config.SEARCH.YEAR = min + "," + max;
		}
    parent.postMessage({
      origin: window.name,
      records: this.model.get("records"),
      url: iframeUrl,
      searchUrl: $.param(config.SEARCH)
    }, '*');
  },

  _updateLegendTitle: function() {
    $(this.$legend_title).text(this.model.get("current_title"));
  },

  _updateLegendDesc: function() {
    $(this.$legend_desc).text("Showing data from " + this.model.get("left_year") + " to " + this.model.get("right_year") + " (" + this.model.get("records") + " records)");
  },

  _enableDrag: function() {
    this.$el.find(".handle").draggable({
      containment: "parent",
      grid:  [this.grid_x, 0],
      axis:  "x",
      start: this._onStartDrag,
      drag:  this._onDrag,
      stop:  this._onStopDrag
    });
  },

  _storeDatePositions: function() {
    var self = this;

    this.years  = [];

    var j    = 0;
    var year = 0;

    _.each(this.$years.find(".year a"), function(y, i) {
      year = parseInt($(y).attr("data-year"), 10);
      self.years[i] = [$(y).position().left, year];
    });
  },

  _drawGraph: function() {
    var self = this;

    this.data = [];
    this.nums = [];

    for(var i = 0; i < this.years.length; i++) {
      item = {};

      item['year'] = this.years[i][1];

      if(Array.isArray(cats[this.model.get("current_cat")]['years'][this.years[i][1]])) {
        var _num = 0;

        for(var j = 0; j < cats[this.model.get("current_cat")]['years'][this.years[i][1]].length; j++) {
          _num = _num + aggr_data[cats[this.model.get("current_cat")]['years'][this.years[i][1]][j]];
        }

        item['num'] = _num;
      } else {
        item['num'] = aggr_data[cats[this.model.get("current_cat")]['years'][this.years[i][1]]];
      }

      this.nums[i] = item['num'];

      this.data.push(item);
    }

    var x_extent = [1900, 2020],
        x_scale = d3.scale.linear()
                    .range([0,config.GRAPH_W])
                    .domain(x_extent);

    var y_extent = [d3.min(this.nums), d3.max(this.nums)],
        y_scale = d3.scale.linear()
                    .range([config.GRAPH_H, config.GRAPH_MARGIN])
                    .domain(y_extent);

    svg.selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("width", this.grid_x)
      .attr("height", 4)
      .attr("class", "bar")
      .attr("x", function(d) {
        return x_scale(d['year'])
      })
      .attr("y", function(d) {
        return y_scale(d['num'])
      });
  },

  _updateGraph: function() {
    var self = this;

    this.data = [];
    this.nums = [];

    for(var i = 0; i < this.years.length; i++) {
      item = {};

      item['year'] = this.years[i][1];
      if(Array.isArray(cats[this.model.get("current_cat")]['years'][this.years[i][1]])) {
        var _num = 0;

        for(var j = 0; j < cats[this.model.get("current_cat")]['years'][this.years[i][1]].length; j++) {
          _num = _num + aggr_data[cats[this.model.get("current_cat")]['years'][this.years[i][1]][j]];
        }

        item['num'] = _num;
      } else {
        item['num'] = aggr_data[cats[this.model.get("current_cat")]['years'][this.years[i][1]]];
      }

      this.nums[i] = item['num'];

      this.data.push(item);
    }

    var x_extent = [1900, 2020],
        x_scale = d3.scale.linear()
                    .range([0,config.GRAPH_W])
                    .domain(x_extent);

    var y_extent = [d3.min(this.nums), d3.max(this.nums)],
        y_scale = d3.scale.linear()
                    .range([config.GRAPH_H, config.GRAPH_MARGIN])
                    .domain(y_extent);

    svg.selectAll(".bar")
      .data(this.data)
      .attr("x", function(d) {
        return x_scale(d['year'])
      })
      .attr("y", function(d) {
        return y_scale(d['num'])
      });
  },

  _init: function() {
    var self = this;

    if (this.initialized) return;

    this.initialized = true;

    this.$left_handle  = this.$el.find(".handle.left");
    this.$right_handle = this.$el.find(".handle.right");

    this.$tipsy        = $(".tipsy");

    this.$years        = this.$el.find(".years");
    this.$months       = this.$el.find(".visible_months");
    this.$trail        = this.$el.find(".trail");
    this.$range        = this.$el.find(".range");

    this.$timeline_control = $(this.button.$el);
    this.$zoom_control = $(".leaflet-control-zoom");
    this.$control_top_right = $(".selectors")

    this.$legend_title = this.$el.find(".legend .title");
    this.$legend_desc = this.$el.find(".legend .desc");

    this.options.container.append(this.$el);

    svg = d3.select(".legend")
      .append("svg")
      .attr("width", config.GRAPH_W)
      .attr("height", config.GRAPH_H+2*config.GRAPH_MARGIN);

    this._storeDatePositions();
    this._enableDrag();

    var left_handle_x  = parseInt(_.keys(this.years)[0], 10);
    var right_handle_x = parseInt(_.keys(this.years)[_.size(this.years)-1], 10) + 3;

    this.model.set("left_handle",  0);
    this.model.set("right_handle", right_handle_x*this.grid_x);

    if(typeof cats[this.model.get("current_cat")]['years'] != 'undefined') {
      this._drawGraph();
      setTimeout(function() { self._adjustHandlePosition(); }, 250);
    } else {
      this.$el.find(".legend svg").hide();
      this.$el.find(".slider").hide();

      $(this.$el).animate({
        "height": 44
      }, 150).addClass("collapsed");

      var key = cats[this.model.get("current_cat")]['key'];

      this.model.set("records", aggr_data[key]);

      $(this.$legend_desc).text("Showing all records (" + this.model.get("records") + ")");

      mainLayer.setKey(key);
    }
  },

  _onClickHamburger: function(e) {
    e.preventDefault();

    this.timeline_tooltip.toggle();
  },

  _onChangeCurrentCat: function() {
    var self = this;

    if(typeof cats[this.model.get("current_cat")]['years'] != 'undefined') {
      this.$el.find(".legend svg").show();
      this.$el.find(".slider").show();

      if(!this.model.get("collapsed")) {
        $(this.$el).animate({
          "height": 150
        }, 150).removeClass("collapsed");
      }

      var left_handle_x  = parseInt(_.keys(this.years)[0], 10);
      var right_handle_x = parseInt(_.keys(this.years)[_.size(this.years)-1], 10) + 3;

      this.model.set("left_handle",  left_handle_x);
      this.model.set("right_handle", right_handle_x*this.grid_x);

      setTimeout(function() { self._adjustBothHandles(); }, 250);

      this._updateGraph();
    } else {
      this.$el.find(".legend svg").hide();
      this.$el.find(".slider").hide();

      $(this.$el).animate({
        "height": 44
      }, 150).addClass("collapsed");

      var key = cats[this.model.get("current_cat")]['key'];

      this.model.set("records", aggr_data[key]);

      $(this.$legend_desc).text("Showing all records (" + this.model.get("records") + ")");
			
			mainLayer.setKey(key);
    }

    this._updateLegendTitle();
  },

  updateCat: function(key, title) {
    this.model.set("current_title", title);
    this.model.set("current_cat", key);

		// construct the basis of record for the search
		switch(this.model.get("current_cat")) {
		  case "sp": config.SEARCH.BASIS_OF_RECORD = "PRESERVED_SPECIMEN"; break;
		  case "obs": config.SEARCH.BASIS_OF_RECORD = "OBSERVATION"; break;
		  case "living": config.SEARCH.BASIS_OF_RECORD = "LIVING_SPECIMEN"; break;
		  case "fossil": config.SEARCH.BASIS_OF_RECORD = "FOSSIL_SPECIMEN"; break;
		  case "oth": config.SEARCH.BASIS_OF_RECORD = "UNKNOWN"; break;
		  default: config.SEARCH = _.omit(config.SEARCH, "BASIS_OF_RECORD"); 
		}
		
		// only living or fossil need to fire events- the others trigger a slider change, which will message
		if (this.model.get("current_cat") == "living" || this.model.get("current_cat") == "fossil") {
		  config.SEARCH = _.omit(config.SEARCH, "YEAR"); // no year filter for living or fossil 
      parent.postMessage({
        origin: window.name,
        records: this.model.get("records"),
        url: $.param(config.MAP), // iframe URL
        searchUrl: $.param(config.SEARCH)
      }, '*');
		}
  },

  render: function() {
    this.$el.append(this.template.render( this.model.toJSON() ));
    return this.$el;
  }
});
