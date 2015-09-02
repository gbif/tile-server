package org.gbif.metrics.tile.utils;

import javax.servlet.http.HttpServletRequest;

public class HttpParamsUtils {

  public static Float extractFloat(HttpServletRequest req, String key, boolean required) throws IllegalArgumentException {
    if (req.getParameter(key) != null) {
      try {
        return Float.parseFloat(req.getParameter(key));
      } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Parameter [" + key + "] is invalid.  Supplied: " + req.getParameter(key));
      }
    }
    if (required) {
      throw new IllegalArgumentException("Parameter [" + key + "] is required");
    }
    return null;
  }

  public static int getIntParam(HttpServletRequest request, String param, int defaultVal) {
    final String[] vals = request.getParameterValues(param);
    if (vals != null && vals.length > 0) {
      try {
        return Integer.parseInt(vals[0]);
      } catch (NumberFormatException e) {
        return defaultVal;
      }
    }
    return defaultVal;
  }

  /**
   * Default private constructor.
   */
  private HttpParamsUtils(){
    //empty block
  }
}
