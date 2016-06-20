package org.gbif.maps;

import org.gbif.metrics.cube.tile.MercatorProjectionUtil;

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

  public static Rectangle2D.Double getTileRect(int x, int y, int zoom) {
    MercatorProjectionUtil s;
    final int tilesAtThisZoom = 1 << zoom;
    final double lngWidth = 360.0 / tilesAtThisZoom; // width in degrees longitude
    final double lng = -180 + (x * lngWidth); // left edge in degrees longitude

    final double latHeightMerc = 1.0 / tilesAtThisZoom; // height in "normalized" mercator 0,0 top left
    final double topLatMerc = y * latHeightMerc; // top edge in "normalized" mercator 0,0 top left
    final double bottomLatMerc = topLatMerc + latHeightMerc;

    // convert top and bottom lat in mercator to degrees
    // note that in fact the coordinates go from about -85 to +85 not -90 to 90!
    final double bottomLat = y2lat(bottomLatMerc);


    final double latHeight = y2lat(topLatMerc) - bottomLat;

    return new Rectangle2D.Double(lng, bottomLat, lngWidth, latHeight);
  }

  /**
   * Private hidden constructor.
   */
  private MercatorUtil(){
    //empty
  }
}
