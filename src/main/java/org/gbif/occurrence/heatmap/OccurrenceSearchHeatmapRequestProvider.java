package org.gbif.occurrence.heatmap;

import org.gbif.api.model.occurrence.search.OccurrenceHeatmapSearchRequest;
import org.gbif.api.model.occurrence.search.OccurrenceSearchParameter;
import org.gbif.api.util.SearchTypeValidator;
import org.gbif.api.util.VocabularyUtils;
import org.gbif.maps.MercatorUtil;
import org.gbif.metrics.tile.utils.HttpParamsUtils;
import org.gbif.ws.util.WebserviceParameter;

import java.awt.*;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import com.google.common.base.Strings;
import com.google.common.collect.Lists;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OccurrenceSearchHeatmapRequestProvider {

  public static final String POLYGON_PATTERN = "POLYGON((%s))";
  private static final Logger LOG = LoggerFactory.getLogger(OccurrenceSearchHeatmapRequestProvider.class);

  public static OccurrenceHeatmapSearchRequest buildOccurrenceHeatmapSearchRequest(HttpServletRequest request){
    OccurrenceHeatmapSearchRequest occurrenceHeatmapSearchRequest = new OccurrenceHeatmapSearchRequest();
    //no rows info is required
    occurrenceHeatmapSearchRequest.getSearchRequest().setLimit(0);
    occurrenceHeatmapSearchRequest.getSearchRequest().setOffset(0);

    final String q = request.getParameter(WebserviceParameter.PARAM_QUERY_STRING);

    if (!Strings.isNullOrEmpty(q)) {
      occurrenceHeatmapSearchRequest.getSearchRequest().setQ(q);
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
          if(OccurrenceSearchParameter.GEOMETRY == p) {
            String polygon =  String.format(POLYGON_PATTERN,val);
            occurrenceHeatmapSearchRequest.getSearchRequest().addParameter(p, polygon);
          } else {
            SearchTypeValidator.validate(p, val);
            occurrenceHeatmapSearchRequest.getSearchRequest().addParameter(p, val);
          }
        }
      }
    }
    int x = HttpParamsUtils.getIntParam(request, "x", 0);
    int y = HttpParamsUtils.getIntParam(request, "y", 0);
    int z = HttpParamsUtils.getIntParam(request, "z", 0);
    LOG.info("Querying for tile in x {} y {} z {}",x,y,z);
    occurrenceHeatmapSearchRequest.setGeometry(getGeometryFromXY(x, y, z));
    LOG.info("Querying using Geometry",occurrenceHeatmapSearchRequest.getGeometry());
    occurrenceHeatmapSearchRequest.setZoom(z);
  }

  /**
   *
   * @return a bounding box calculated from the X,Y coordinates
   */
  private static String getGeometryFromXY(int x, int y, int z) {
    Rectangle rect =  MercatorUtil.getTileRect(x, y, z).getBounds();
    return "[\""+ rect.getMinX()  + " " + rect.getMinY() + "\" TO \"" + rect.getMaxX() + " " + rect.getMaxY() +  "\"]";
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
