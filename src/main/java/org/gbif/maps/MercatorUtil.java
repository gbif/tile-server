package org.gbif.maps;

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

  /**
   * Private hidden constructor.
   */
  private MercatorUtil(){
    //empty
  }
}
