package org.gbif.occurrence.heatmap;


import org.gbif.maps.MercatorUtil;
import org.gbif.maps.MetadataProvider;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.metrics.tile.ColorPalette;
import org.gbif.metrics.tile.DensityColorPaletteFactory;
import org.gbif.metrics.tile.HSBPalette;
import org.gbif.metrics.tile.NamedPalette;
import org.gbif.metrics.tile.PNGWriter;
import org.gbif.metrics.tile.utils.HttpParamsUtils;
import org.gbif.occurrence.search.heatmap.OccurrenceHeatmapRequest;
import org.gbif.occurrence.search.heatmap.OccurrenceHeatmapRequestProvider;
import org.gbif.occurrence.search.heatmap.OccurrenceHeatmapResponse;
import org.gbif.occurrence.search.heatmap.OccurrenceHeatmapsService;

import java.awt.geom.Rectangle2D;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.common.collect.Lists;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.yammer.metrics.Metrics;
import com.yammer.metrics.core.Meter;
import com.yammer.metrics.core.Timer;
import com.yammer.metrics.core.TimerContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A simple tile rendering servlet that sources it's data from SOLR.
 * This capability is "shoe-horned" into this implementation with the work underway in gbithub.com/gbif/maps being
 * the long term home.
 */
@SuppressWarnings("serial")
@Singleton
public class OccurrenceHeatmapRenderer extends HttpServlet {

  private static final String JSON_SUFFIX = ".json";

  private static final Logger LOG = LoggerFactory.getLogger(OccurrenceHeatmapRenderer.class);


  // allow monitoring of cube lookup, rendering speed and the throughput per second
  private final Timer pngRenderTimer = Metrics.newTimer(OccurrenceHeatmapRenderer.class, "pngRenderDuration",
    TimeUnit.MILLISECONDS, TimeUnit.SECONDS);
  private final Meter requests = Metrics.newMeter(OccurrenceHeatmapRenderer.class, "requests", "requests", TimeUnit.SECONDS);

  private final OccurrenceHeatmapsService occurrenceHeatmapsService;

  public static Rectangle2D.Double expand(Rectangle2D.Double rect, double amountX, double amountY)
  {
    return new Rectangle2D.Double(
      rect.getX() - amountX,
      rect.getY() - amountY,
      rect.getWidth() + (2*amountX),
      rect.getHeight() + (2*amountY)
    );
  }

  /**
   * Provides the bounding box from the x,y,z parameters.
   * @param projected true for web mercator, false for wgs84 planar (4326)
   */
  private static String getGeom(int z, int x, int y, boolean projected) {
    if (projected) {
      Rectangle2D.Double rect = MercatorUtil.getTileRect(x, y, z);
      return "[" + rect.getMinX() + " " + rect.getMinY() + " TO " + rect.getMaxX() + " " + rect.getMaxY() + "]";
    }
    else return tileBoundaryWGS84(z, x, y);
  }

  /**
   * Returns a SOLR search string for the geometry in WGS84 CRS for the tile.
   */
  private static String tileBoundaryWGS84(int z, long x, long y) {
    int tilesPerZoom = 1 << z;
    double degsPerTile = 360d/tilesPerZoom;

    double minLng = degsPerTile * x - 180;
    double maxLat = 180 - (degsPerTile * y); // note EPSG:4326 covers only half the space vertically hence 180

    // clip to the world extent
    maxLat = Math.min(maxLat,90);
    double minLat = Math.max(maxLat-degsPerTile,-90);
    return "[" + minLng + " " + minLat + " TO "
           + (minLng+degsPerTile) + " " + maxLat + "]";
  }

  @Inject
  public OccurrenceHeatmapRenderer(OccurrenceHeatmapsService occurrenceHeatmapsService){
    this.occurrenceHeatmapsService = occurrenceHeatmapsService;
  }

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    requests.mark();
    // as a tile server, we support cross domain requests
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Prototype-Version, X-CSRF-Token");
    resp.setHeader("Cache-Control", "public,max-age=60"); // encourage a 60 second caching by everybody
    if (req.getRequestURI().endsWith(JSON_SUFFIX)) {
      renderMetadata(req, resp);
    } else {
      renderPNG(req, resp);
    }
  }

  protected void renderPNG(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    resp.setHeader("Content-Type", "image/png");
    try {
      int x = HttpParamsUtils.getIntParam(req, "x", 0);
      int y = HttpParamsUtils.getIntParam(req, "y", 0);
      int z= HttpParamsUtils.getIntParam(req, "z", 0);

      boolean projected = "EPSG:4326".equalsIgnoreCase(req.getParameter("srs")) ? false : true;
      OccurrenceHeatmapRequest heatmapRequest = OccurrenceHeatmapRequestProvider.buildOccurrenceHeatmapRequest(req);

      heatmapRequest.setGeometry(getGeom(z, x, y, projected));
      // Tim note: by testing in production index, we determine that 4 is a sensible performance choice
      // every 4 zoom levels the grid resolution increases
      int solrLevel = ((int)(z/4))*4;
      heatmapRequest.setZoom(solrLevel);
      OccurrenceHeatmapResponse heatMapResponse = occurrenceHeatmapsService.searchHeatMap(heatmapRequest);
      if (heatMapResponse != null) {
        // add a header to help in debugging issues
        resp.setHeader("X-GBIF-Total-Count", heatMapResponse.getCount().toString());

        final TimerContext context = pngRenderTimer.time();
        try {
          String[] layerStrings = req.getParameterValues("layer");
          List<Layer> l = Lists.newArrayList();
          if (layerStrings != null) {
            for (String ls : layerStrings) {
              try {
                l.add(Layer.valueOf(ls));
                LOG.debug("Layer requested: {}", Layer.valueOf(ls));
              } catch (Exception e) {
                LOG.warn("Invalid layer supplied, ignoring: " + ls);
              }
            }
          } else {
            LOG.debug("No layers returned, merging all layers");
          }

          // determine if there is a named palette
          ColorPalette p = DensityColorPaletteFactory.YELLOWS_REDS;
          String paletteName = req.getParameter("palette");
          if (paletteName != null) {
            try {
              p = NamedPalette.valueOf(paletteName).getPalette();
            } catch (Exception e) {
            }
          } else if (req.getParameter("colors") != null) {
            p = DensityColorPaletteFactory.build(req.getParameter("colors"));
          } else if (req.getParameter("saturation") != null) {
            final Float hue = HttpParamsUtils.extractFloat(req, "hue", false);
            p = hue!=null ? new HSBPalette(hue) : new HSBPalette();
          }
          if (projected) {
            PNGWriter.write(heatMapResponse, resp.getOutputStream(), z, x, y, p);
          } else {
            PNGWriter.writeUnprojected(heatMapResponse, resp.getOutputStream(), z, x, y, p);
          }

        } finally {
          context.stop();
        }
      } else {
        if (!resp.isCommitted()) {
          resp.getOutputStream().write(PNGWriter.EMPTY_TILE);
        }

      }
    } catch (IllegalArgumentException e) {
      // If we couldn't get the content from the request
      if (!resp.isCommitted()) {
        resp.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
      }

    } catch (Exception e) {
      // We are unable to get or render the tile, or the client has terminated the connection
      LOG.error(e.getMessage(), e);
      if (!resp.isCommitted()) {
        resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Tile server is out of action, please try later");
      }

    }
    resp.flushBuffer();
  }

  /**
   * Writes the metadata in json format.
   */
  private void renderMetadata(HttpServletRequest req, HttpServletResponse resp) throws IOException,ServletException {
    OccurrenceHeatmapResponse heatMapResponse = occurrenceHeatmapsService.searchHeatMap(OccurrenceHeatmapRequestProvider.buildOccurrenceHeatmapRequest(req));
    MetadataProvider.renderMetadata(req,resp,heatMapResponse.getCount(),heatMapResponse.getMinY(),heatMapResponse.getMinX(),heatMapResponse.getMaxY(),heatMapResponse.getMaxX());
  }
}
