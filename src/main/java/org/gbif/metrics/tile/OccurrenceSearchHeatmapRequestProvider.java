package org.gbif.metrics.tile;

import org.gbif.api.model.occurrence.search.OccurrenceHeatmapSearchRequest;
import org.gbif.api.model.occurrence.search.OccurrenceSearchParameter;
import org.gbif.api.util.SearchTypeValidator;
import org.gbif.api.util.VocabularyUtils;
import org.gbif.metrics.cube.tile.MercatorProjectionUtil;
import org.gbif.metrics.tile.utils.HttpParamsUtils;
import org.gbif.ws.util.WebserviceParameter;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import com.google.common.base.Strings;
import com.google.common.collect.Lists;

public class OccurrenceSearchHeatmapRequestProvider {

  private static final String PARAM_HEATMAP_GEOM = "geom";
  private static final String PARAM_HEATMAP_GRID_LEVEL = "gridLevel";


  public static OccurrenceHeatmapSearchRequest buildOccurrenceHeatmapSearchRequest(HttpServletRequest request){
    OccurrenceHeatmapSearchRequest occurrenceHeatmapSearchRequest = new OccurrenceHeatmapSearchRequest();
    final String q = request.getParameter(WebserviceParameter.PARAM_QUERY_STRING);

    if (!Strings.isNullOrEmpty(q)) {
      occurrenceHeatmapSearchRequest.setQ(q);
    }
    // find search parameter enum based filters
    setSearchParams(occurrenceHeatmapSearchRequest, request);
    return occurrenceHeatmapSearchRequest;
  }

  /**
   * Iterates over the params map and adds to the search request the recognized parameters (i.e.: those that have a
   * correspondent value in the P generic parameter).
   * Empty (of all size) and null parameters are discarded.
   */
  private static void setSearchParams(OccurrenceHeatmapSearchRequest occurrenceHeatmapSearchRequest, HttpServletRequest request) {
    for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
      OccurrenceSearchParameter p = findSearchParam(entry.getKey());
      if (p != null) {
        for (String val : removeEmptyParameters(entry.getValue())) {
          // validate value for certain types
          SearchTypeValidator.validate(p, val);
          occurrenceHeatmapSearchRequest.addParameter(p, val);
        }
      }
    }

    occurrenceHeatmapSearchRequest.setGeometry(getGeometryFromXY(request));
        String heatMapGridLevel = request.getParameter(PARAM_HEATMAP_GRID_LEVEL);
    if(!Strings.isNullOrEmpty(heatMapGridLevel)){
      occurrenceHeatmapSearchRequest.setGridLevel(Integer.parseInt(heatMapGridLevel));
    }
  }

  /**
   *
   * @return a bounding box calculated from the X,Y coordinates
   */
  private static String getGeometryFromXY(HttpServletRequest request) {
    int x = HttpParamsUtils.getIntParam(request, "x", 0);
    int y = HttpParamsUtils.getIntParam(request, "y", 0);
    int z = HttpParamsUtils.getIntParam(request, "z", 0);
    Rectangle rect = getTileRect(x, y, z).getBounds();
    return "[\""+ rect.getMinX()  + " " + rect.getMinY() + "\" TO \"" + rect.getMaxX() + " " + rect.getMaxY() +  "\"]";
  }

  public static Rectangle2D.Double getTileRect(int x, int y, int zoom) {
    int tilesAtThisZoom = 1 << zoom;
    double lngWidth = 360.0 / tilesAtThisZoom; // width in degrees longitude
    double lng = -180 + (x * lngWidth); // left edge in degrees longitude

    double latHeightMerc = 1.0 / tilesAtThisZoom; // height in "normalized" mercator 0,0 top left
    double topLatMerc = y * latHeightMerc; // top edge in "normalized" mercator 0,0 top left
    double bottomLatMerc = topLatMerc + latHeightMerc;

    // convert top and bottom lat in mercator to degrees
    // note that in fact the coordinates go from about -85 to +85 not -90 to 90!
    double bottomLat = Math.toDegrees((2 * Math.atan(Math.exp(Math.PI * (1 - (2 * bottomLatMerc))))) - (Math.PI / 2));

    double topLat = Math.toDegrees((2 * Math.atan(Math.exp(Math.PI * (1 - (2 * topLatMerc))))) - (Math.PI / 2));

    double latHeight = topLat - bottomLat;

    return new Rectangle2D.Double(lng, bottomLat, lngWidth, latHeight);
  }

  private static OccurrenceSearchParameter findSearchParam(String name) {
    try {
      return (OccurrenceSearchParameter) VocabularyUtils.lookupEnum(name, OccurrenceSearchParameter.class);
    } catch (IllegalArgumentException e) {
      // we have all params here, not only the enum ones, so this is ok to end up here a few times
    }
    return null;
  }


  /**
   * Removes all empty and null parameters from the list.
   * Each value is trimmed(String.trim()) in order to remove all sizes of empty parameters.
   */
  private static List<String> removeEmptyParameters(String[] parameters) {
    List<String> cleanParameters = Lists.newArrayList();
    for (String param : parameters) {
      final String cleanParam = Strings.nullToEmpty(param).trim();
      if (cleanParam.length() > 0) {
        cleanParameters.add(cleanParam);
      }
    }
    return cleanParameters;
  }
}
