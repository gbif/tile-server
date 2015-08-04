package org.gbif.metrics.tile;

import org.gbif.metrics.cube.tile.density.DensityCube;
import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.metrics.tile.solr.SolrHeatmapRenderer;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPOutputStream;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.common.base.Optional;
import com.google.common.collect.Lists;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.urbanairship.datacube.DataCubeIo;
import com.yammer.metrics.Metrics;
import com.yammer.metrics.core.Meter;
import com.yammer.metrics.core.Timer;
import com.yammer.metrics.core.TimerContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A simple tile rendering servlet that sources it's data from a data cube.
 */
@SuppressWarnings("serial")
@Singleton
public class OccurrenceHeatmapRenderer extends HttpServlet {
  private static final Logger LOG = LoggerFactory.getLogger(OccurrenceHeatmapRenderer.class);


  // allow monitoring of cube lookup, rendering speed and the throughput per second
  private final Timer pngRenderTimer = Metrics.newTimer(OccurrenceHeatmapRenderer.class, "pngRenderDuration",
    TimeUnit.MILLISECONDS, TimeUnit.SECONDS);
  private final Timer tcJsonRenderTimer = Metrics.newTimer(OccurrenceHeatmapRenderer.class, "tileCubeJsonRenderDuration",
    TimeUnit.MILLISECONDS, TimeUnit.SECONDS);
  private final Meter requests = Metrics.newMeter(OccurrenceHeatmapRenderer.class, "requests", "requests", TimeUnit.SECONDS);


  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    requests.mark();
    // as a tile server, we support cross domain requests
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Prototype-Version, X-CSRF-Token");
    resp.setHeader("Cache-Control", "public,max-age=60"); // encourage a 60 second caching by everybody
    renderPNG(req, resp);
  }

  protected void renderPNG(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    resp.setHeader("Content-Type", "image/png");
    try {
      SolrHeatmapRenderer.SolrHeatmapResponse solrHeatmapResponse =  SolrHeatmapRenderer.uatQuery();
      if (solrHeatmapResponse != null) {
        int x = getParam(req, "x", 0);
        int y = getParam(req, "y", 0);
        int z= getParam(req, "z", 0);
        // add a header to help in debugging issues
        resp.setHeader("X-GBIF-Total-Count", solrHeatmapResponse.getCount().toString());

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
            final Float hue = extractFloat(req, "hue", false);
            p = hue!=null ? new HSBPalette(hue) : new HSBPalette();
          }
          PNGWriter.write(solrHeatmapResponse, resp.getOutputStream(), z,x,y,p);
        } finally {
          context.stop();
        }
      } else {
        resp.getOutputStream().write(PNGWriter.EMPTY_TILE);
      }
    } catch (IllegalArgumentException e) {
      // If we couldn't get the content from the request
      resp.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
    } catch (Exception e) {
      // We are unable to get or render the tile
      LOG.error(e.getMessage(), e);
      resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Tile server is out of action, please try later");
    }
    resp.flushBuffer();
  }

  protected Float extractFloat(HttpServletRequest req, String key, boolean required) throws IllegalArgumentException {
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

  private int getParam(HttpServletRequest request, String param, int defaultVal) {
    String[] vals = request.getParameterValues(param);
    if (vals != null && vals.length > 0) {
      try {
        return Integer.parseInt(vals[0]);
      } catch (NumberFormatException e) {
        return defaultVal;
      }
    }
    return defaultVal;
  }
}
