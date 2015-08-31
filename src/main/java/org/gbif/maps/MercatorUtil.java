package org.gbif.maps;

import java.awt.geom.Rectangle2D;

/**
 * Utility class for Mercator utility methods.
 */
public class MercatorUtil {

  private static final double MAX_LAT = 85;
  private static final double MIN_LAT = -MAX_LAT;

  /**
   * This method restricts the max and min latitude to (+/-) 85 which is the limit of the Mercator projection.
   * @param lat latitude to be tested
   * @return
   */
  public static Double getLatInMercatorLimit(Double lat){
    if(lat < MIN_LAT){
      return MIN_LAT;
    } else if(lat > MAX_LAT) {
      return MAX_LAT;
    }
    return lat;
  }

  public static double y2lat(double aY) {
    return  Math.toDegrees((2 * Math.atan(Math.exp(Math.PI * (1 - (2 * aY))))) - (Math.PI / 2));
  }

  public static double lat2y(double aLat) {
    return Math.toDegrees(Math.log(Math.tan(Math.PI/4+Math.toRadians(aLat)/2)));
  }

  public static Rectangle2D.Double getTileRect(int x, int y, int zoom) {
    final int tilesAtThisZoom = 1 << zoom;
    final double lngWidth = 360.0 / tilesAtThisZoom; // width in degrees longitude
    final double lng = -180 + (x * lngWidth); // left edge in degrees longitude

    final double latHeightMerc = 1.0 / tilesAtThisZoom; // height in "normalized" mercator 0,0 top left
    final double topLatMerc = y * latHeightMerc; // top edge in "normalized" mercator 0,0 top left
    final double bottomLatMerc = topLatMerc + latHeightMerc;

    // convert top and bottom lat in mercator to degrees
    // note that in fact the coordinates go from about -85 to +85 not -90 to 90!
    final double bottomLat = MercatorUtil.y2lat(bottomLatMerc);


    final double latHeight = MercatorUtil.y2lat(topLatMerc) - bottomLat;

    return new Rectangle2D.Double(lng, bottomLat, lngWidth, latHeight);
  }

  /**
   * returns a Rectangle2D with x = lon, y = lat, width=lonSpan, height=latSpan
   * for an x,y,zoom as used by google.
   */
  public static Rectangle2D.Double getLatLong(int x, int y, int zoom) {
    double lon      = -180; // x
    double lonWidth = 360; // width 360

    //double lat = -90;  // y
    //double latHeight = 180; // height 180
    double lat       = -1;
    double latHeight = 2;

    int tilesAtThisZoom = 1 << zoom;
    lonWidth  = 360.0 / tilesAtThisZoom;
    lon       = -180 + (x * lonWidth);
    latHeight = -2.0 / tilesAtThisZoom;
    lat       = 1 + (y * latHeight);

    // convert lat and latHeight to degrees in a transverse mercator projection
    // note that in fact the coordinates go from about -85 to +85 not -90 to 90!
    latHeight += lat;
    latHeight = (2 * Math.atan(Math.exp(Math.PI * latHeight))) - (Math.PI / 2);
    latHeight *= (180 / Math.PI);

    lat = (2 * Math.atan(Math.exp(Math.PI * lat))) - (Math.PI / 2);
    lat *= (180 / Math.PI);

    latHeight -= lat;

    if (lonWidth < 0) {
      lon      = lon + lonWidth;
      lonWidth = -lonWidth;
    }

    if (latHeight < 0) {
      lat       = lat + latHeight;
      latHeight = -latHeight;
    }

    return new Rectangle2D.Double(lon, lat, lonWidth, latHeight);
  }

  /**
   * Private hidden constructor.
   */
  private MercatorUtil(){
    //empty
  }
}
