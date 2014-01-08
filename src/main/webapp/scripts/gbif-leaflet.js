/**
 * Provides necessary utilities to communicate with the GBIF tile server for server side rendered
 * tiles for use in Leaflet.
 */
L.GBIFLayer = L.TileLayer.extend({
  // maps the IDs used in the map options (e.g. the time slider) to server side layer names 
  key_mapping: {
		0: "SP_NO_YEAR",
		1: "SP_PRE_1900",
		2: "SP_1900_1910",
		3: "SP_1910_1920",
		4: "SP_1920_1930",
		5: "SP_1930_1940",
		6: "SP_1940_1950",
		7: "SP_1950_1960",
		8: "SP_1960_1970",
		9: "SP_1970_1980",
		10: "SP_1980_1990",
		11: "SP_1990_2000",
		12: "SP_2000_2010",
		13: "SP_2010_2020",
		14: "OBS_NO_YEAR",
		15: "OBS_PRE_1900",
		16: "OBS_1900_1910",
		17: "OBS_1910_1920",
		18: "OBS_1920_1930",
		19: "OBS_1930_1940",
		20: "OBS_1940_1950",
		21: "OBS_1950_1960",
		22: "OBS_1960_1970",
		23: "OBS_1970_1980",
		24: "OBS_1980_1990",
		25: "OBS_1990_2000",
		26: "OBS_2000_2010",
		27: "OBS_2010_2020",
		28: "LIVING",
		29: "FOSSIL",
		30: "OTH_NO_YEAR",
		31: "OTH_PRE_1900",
		32: "OTH_1900_1910",
		33: "OTH_1910_1920",
		34: "OTH_1920_1930",
		35: "OTH_1930_1940",
		36: "OTH_1940_1950",
		37: "OTH_1950_1960",
		38: "OTH_1960_1970",
		39: "OTH_1970_1980",
		40: "OTH_1980_1990",
		41: "OTH_1990_2000",
		42: "OTH_2000_2010",
		43: "OTH_2010_2020"
  },
  
  /**
   * Stores the base URL so we can reconstruct it with keys later.
   */
  initialize: function(url, options) {
    L.TileLayer.prototype.initialize.call(this, url, options); 
    this.base_url = url;
  },
  
  /**
   * Takes the keys of the map layers to enable, and triggers a refresh.
   * E.g. when a time slider changes, this should be called.
   */
  setKey: function(key) {
    var orig = this.key_array;
    // it can be an array or a single value
    if (key.length === undefined) {
      this.key_array = [key];
    } else {
      this.key_array = key;
    }
    // only redraw if it has changed from the first set (which is null)
    if (orig !== undefined) {
      this.refreshView();
    }
  },
  
  /**
   * This expects the parameter to append to the URL to customize the style. It should not include
   * & at the beginning.  E.g. "saturation=true" would be acceptable, not "&saturation=true"
   */ 
  setStyle: function(style) {
    if (this.options.style != style) {
      this.options.style = style;
      this.redraw();    
    }
  },
  
  /**
   * Sets the resolution for the map
   */ 
  setResolution: function(resolution) {
    if (this.options.resolution != resolution) {
      this.options.resolution = resolution;
      this.redraw();    
    }
  },
  
  /**
   * Using the base url template, constructs a new URL for the style, resolution and options
   * chosen and triggers a redraw.
   */
  refreshView: function() {
    if (this.key_array !== undefined) {
      // build the new URL
      var layers = [];
      for (var i=0; i<this.key_array.length; i++) {
        var key = this.key_array[i];
        layers.push('layer=' + this.key_mapping[key]);
      }
      var new_url = this.base_url + "&" + layers.join("&"); 
            
      // only trigger a refresh if the URL has actually changed
      if (this._url != new_url) {
        this.setUrl(new_url);
      }
    }
  }
});