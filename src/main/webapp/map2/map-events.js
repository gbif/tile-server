/**
 * When using the iframe embedded maps, we wish to subscribe to changes, to allow us to 
 * create links based on the state of the map.  This simplifies it by allowing you to do this:
 *
 *   // set up the link to the occurrence search
 *   var gbifMapEvents = new GBIFMapListener();
 *   gbifMapEvents.subscribe(function(id, searchUrl) {
 *     $("#geoOccurrenceSearch").attr("href", "<@s.url value='/occurrence/search'/>?" +  searchUrl);
 *   });
 *
 */
function GBIFMapListener () {
  var callbacks = [];

  /**
   * Allows clients to register a callback(targetElementId, searchUrl) for events.
   */
  this.subscribe = function(callback) {
    callbacks.push(callback);
  }

  /**
   * Receives the windowed event, and cycles through any registered callbacks.
   * Callbacks will receive 2 things - the id of the source and search url.  The id means
   * you can have multiple on 1 page.
   */
  this.onMessage = function(event) {
    if (event.data.searchUrl !== undefined) {
      callbacks.forEach(function(callback) {
        callback(event.data.origin, event.data.searchUrl);
      });    
    }
  }
  
	// set up the notifications
  if (window.addEventListener){
    window.addEventListener("message", this.onMessage, false);
  } else if (window.attachEvent){ // IE 
    window.attachEvent('onmessage', this.onMessage);
  }             
}

