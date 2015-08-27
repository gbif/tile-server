package org.gbif.maps;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ObjectNode;

public class MetadataProvider {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  /**
   * Writes the basic metadata of map/tile response.
   */
  public static void renderMetadata(HttpServletRequest req, HttpServletResponse resp, long count, double minimumLatitude, double minimumLongitude, double maximumLatitude, double maximumLongitude) throws ServletException, IOException {
    // as a tile server, we support cross domain requests
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Prototype-Version, X-CSRF-Token");
    resp.setHeader("Cache-Control", "public,max-age=60"); // encourage a 60 second caching by everybody
    resp.setHeader("Content-Type", "application/json");

    ObjectNode node = MAPPER.createObjectNode();
    node.put("count", count);
    node.put("minimumLatitude", minimumLatitude);
    node.put("minimumLongitude", minimumLongitude);
    node.put("maximumLatitude", maximumLatitude);
    node.put("maximumLongitude", maximumLongitude);
    MAPPER.writeValue(resp.getOutputStream(), node);
  }

  /**
   * Private hidden constructor.
   */
  private MetadataProvider(){
    //empty block
  }

}
