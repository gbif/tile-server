package org.gbif.metrics.tile;

import org.gbif.metrics.cube.tile.density.DensityCube;
import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPOutputStream;

import javax.servlet.ServletException;
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
public class DensityTileRenderer extends CubeTileRenderer {
  private static final Logger LOG = LoggerFactory.getLogger(DensityTileRenderer.class);

  private static final String TILE_CUBE_AS_JSON_SUFFIX = ".tcjson";

  // allow monitoring of cube lookup, rendering speed and the throughput per second
  private final Timer pngRenderTimer = Metrics.newTimer(DensityTileRenderer.class, "pngRenderDuration",
    TimeUnit.MILLISECONDS, TimeUnit.SECONDS);
  private final Timer tcJsonRenderTimer = Metrics.newTimer(DensityTileRenderer.class, "tileCubeJsonRenderDuration",
    TimeUnit.MILLISECONDS, TimeUnit.SECONDS);
  private final Meter requests = Metrics.newMeter(DensityTileRenderer.class, "requests", "requests", TimeUnit.SECONDS);

  @Inject
  public DensityTileRenderer(DataCubeIo<DensityTile> cubeIo) {
    super(cubeIo);
  }

  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    requests.mark();
    // as a tile server, we support cross domain requests
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Prototype-Version, X-CSRF-Token");
    resp.setHeader("Cache-Control", "public,max-age=60"); // encourage a 60 second caching by everybody


    if (req.getRequestURI().endsWith(TILE_CUBE_AS_JSON_SUFFIX)) {
      renderTileCubeAsJson(req, resp);
    } else {
      renderPNG(req, resp);
    }
  }

  protected void renderPNG(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    resp.setHeader("Content-Type", "image/png");
    try {
      Optional<DensityTile> tile = getTile(req, DensityCube.INSTANCE);
      if (tile.isPresent()) {
        // add a header to help in debugging issues
        resp.setHeader("X-GBIF-Total-Count", String.valueOf(accumulate(tile.get())));

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
            Float hue = extractFloat(req, "hue", false);
            if (hue!=null) {
              p = new HSBPalette(hue);
            } else {
              p = new HSBPalette();
            }

          }

          PNGWriter.write(tile.get(), resp.getOutputStream(), extractInt(req, REQ_Z, true), p, l.toArray(new Layer[] {}));
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

  /**
   * Accumulates the count represented by the tile.
   */
  private int accumulate(DensityTile tile) {
    int total = 0;
    for (Entry<Layer, Map<Integer, Integer>> e : tile.layers().entrySet()) {
      for (Integer count : e.getValue().values()) {
        total += count;
      }
    }
    return total;
  }
  

  protected void renderTileCubeAsJson(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    resp.setHeader("Content-Type", "application/json");

    try {
      Optional<DensityTile> tile = getTile(req, DensityCube.INSTANCE);
      if (tile.isPresent()) {
        resp.setHeader("X-GBIF-Total-Count", String.valueOf(accumulate(tile.get())));
        final TimerContext context = tcJsonRenderTimer.time();
        try {
          resp.setHeader("Content-Encoding", "gzip");
          GZIPOutputStream os = new GZIPOutputStream(resp.getOutputStream());
          TileCubesWriter.jsonNotation(tile.get(), os);
          os.flush();

        } finally {
          context.stop();
        }
      } else {
        resp.getOutputStream().write(TileCubesWriter.EMPTY_TILE_CUBE);
      }
    } catch (IllegalArgumentException e) {
      // If we couldn't get the content from the request
      resp.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
    } catch (Exception e) {
      // We are unable to get or render the tile
      LOG.error(e.getMessage(), e);
      resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Tile server is out of action, please try later");
    } finally {
      resp.flushBuffer();
    }
  }
}
