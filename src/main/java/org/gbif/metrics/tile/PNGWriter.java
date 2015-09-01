package org.gbif.metrics.tile;

import org.gbif.api.model.occurrence.search.HeatmapResponse;
import org.gbif.maps.MercatorUtil;
import org.gbif.metrics.cube.tile.MercatorProjectionUtil;
import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.common.parsers.geospatial.LatLngBoundingBox;

import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.zip.CRC32;
import java.util.zip.CheckedOutputStream;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;

import com.google.common.collect.Maps;
import com.google.common.io.Closer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A highly optimized PNG tile writer for a DensityTile.
 */
public class PNGWriter {

  public static final byte[] EMPTY_TILE;
  private static final Logger LOG = LoggerFactory.getLogger(PNGWriter.class);
  // see the PNG specification
  private static final byte[] SIGNATURE = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
  private static final int IHDR = 0x49484452;
  private static final int IDAT = 0x49444154;
  private static final int IEND = 0x49454E44;
  private static final byte COLOR_TRUECOLOR_ALPHA = 6;
  private static final byte COMPRESSION_DEFLATE = 0;
  private static final byte FILTER_NONE = 0;
  private static final byte INTERLACE_NONE = 0;
  private static final int TILE_SIZE = 256;
  // This has to come after the rest of the static initialized fields
  static {
    ByteArrayOutputStream baos = null;
    Closer closer = Closer.create();
    try {
      baos = closer.register(new ByteArrayOutputStream());
      byte[] r = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] g = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] b = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] a = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      write(baos, r, g, b, a);
      EMPTY_TILE = baos.toByteArray();
    } catch (IOException e) {
      // This is not recoverable, and indicates catastrophe
      throw new RuntimeException("Unable to produce blank tile during initialization");

    } finally {
      try {
        closer.close();
      } catch (IOException e) {
        throw new RuntimeException("Unable to close outputstream");
      }
    }
  }

  /**
   * Returns a merged Map from the named grids, or all if the layers is not supplied.
   */
  private static Map<Integer, Integer> mergedGrid(Map<Layer, Map<Integer, Integer>> grids, Layer... layers) {
    Map<Integer, Integer> merged = Maps.newHashMap();
    // no layers specified, so flatten the grids into 1
    if (layers == null || layers.length == 0) {
      for (Entry<Layer, Map<Integer, Integer>> e : grids.entrySet()) {
        for (Entry<Integer, Integer> e1 : e.getValue().entrySet()) {
          Integer i = merged.get(e1.getKey());
          i = (i == null) ? e1.getValue() : i + e1.getValue();
          merged.put(e1.getKey(), i);
        }
      }
    } else {
      // extract and merge only the layers requested
      for (Layer l : layers) {
        Map<Integer, Integer> grid = grids.get(l);
        if (grid != null) {
          for (Entry<Integer, Integer> e : grid.entrySet()) {
            Integer i = merged.get(e.getKey());
            i = (i == null) ? e.getValue() : i + e.getValue();
            merged.put(e.getKey(), i);
          }
        }
      }
    }
    return merged;
  }

  private static void paint(byte[] r, byte[] g, byte[] b, byte[] a, byte rc, byte gc, byte bc, byte alpha, int index) {
    if (index >= 0 && index < r.length) {
      r[index] = rc;
      g[index] = gc;
      b[index] = bc;
      a[index] = alpha;
    }
  }

  /**
   * Writes the tile to the stream as a PNG.
   */
  public static void write(DensityTile tile, OutputStream out, int zoom, ColorPalette palette, Layer... layers)
    throws IOException {
    // don't waste time setting up PNG if no data
    if (tile != null && !tile.layers().isEmpty()) {

      // arrays for the RGB and alpha channels
      byte[] r = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] g = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] b = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];
      byte[] a = new byte[DensityTile.TILE_SIZE * DensityTile.TILE_SIZE];

      // paint the pixels for each cell in the tile
      int cellsPerRow = DensityTile.TILE_SIZE / tile.getClusterSize();   MercatorProjectionUtil s;
      Map<Integer, Integer> cells = mergedGrid(tile.layers(), layers);
      for (Entry<Integer, Integer> e : cells.entrySet()) {
        int cellId = e.getKey();
        int offsetX = tile.getClusterSize() * (cellId % cellsPerRow);
        int offsetY = tile.getClusterSize() * (cellId / cellsPerRow);

        // determine the starting draw position
        int cellStart = (offsetY * DensityTile.TILE_SIZE) + (offsetX);

        // for the number of rows in the cell
        for (int i = 0; i < tile.getClusterSize(); i++) {
          // paint the cells pixel by pixel
          for (int j = cellStart; j < cellStart + tile.getClusterSize(); j++) {
            paint(r, g, b, a, palette.red(e.getValue(), zoom), palette.green(e.getValue(), zoom), palette.blue(e.getValue(), zoom),
              palette.alpha(e.getValue(), zoom), j);
          }
          cellStart += DensityTile.TILE_SIZE;
        }
      }

      write(out, r, g, b, a);
    } else {
      // always return a valid image
      out.write(EMPTY_TILE);
    }
  }

  private static void write(OutputStream os, byte[] r, byte[] g, byte[] b, byte[] a) throws IOException {
    try (
      Chunk cIDAT = new Chunk(IDAT);
      Chunk cIHDR = new Chunk(IHDR);
      Chunk cIEND = new Chunk(IEND);
      DataOutputStream dos = new DataOutputStream(os);
      DeflaterOutputStream dfos = new DeflaterOutputStream(cIDAT, new Deflater(Deflater.BEST_COMPRESSION))
    ){
      dos.write(SIGNATURE);

      cIHDR.writeInt(DensityTile.TILE_SIZE);
      cIHDR.writeInt(DensityTile.TILE_SIZE);
      cIHDR.writeByte(8); // 8 bit per component
      cIHDR.writeByte(COLOR_TRUECOLOR_ALPHA);
      cIHDR.writeByte(COMPRESSION_DEFLATE);
      cIHDR.writeByte(FILTER_NONE);
      cIHDR.writeByte(INTERLACE_NONE);
      cIHDR.writeTo(dos);

      int channels = 4;
      int lineLen = DensityTile.TILE_SIZE * channels;
      byte[] lineOut = new byte[lineLen];

      for (int line = 0; line < DensityTile.TILE_SIZE; line++) {
        for (int p = 0; p < DensityTile.TILE_SIZE; p++) {
          lineOut[p * 4 + 0] = r[(line * DensityTile.TILE_SIZE) + p]; // R
          lineOut[p * 4 + 1] = g[(line * DensityTile.TILE_SIZE) + p]; // G
          lineOut[p * 4 + 2] = b[(line * DensityTile.TILE_SIZE) + p]; // B
          lineOut[p * 4 + 3] = a[(line * DensityTile.TILE_SIZE) + p]; // transparency
        }

        dfos.write(FILTER_NONE);
        dfos.write(lineOut);
      }

      dfos.finish();
      cIDAT.writeTo(dos);

      cIEND.writeTo(dos);
      dos.flush();
    }
  }

  private static int clip(int value) {
    return  Math.min(Math.max(value, 0), TILE_SIZE-1);
  }


  /**
   * Writes the data to the stream as a PNG.
   */
  public static void write(HeatmapResponse heatmapResponse, OutputStream out, int zoom, int x, int y, ColorPalette palette)
    throws IOException {

    // don't waste time setting up PNG if no data
    if (heatmapResponse.getCountsInts2D() != null && !heatmapResponse.getCountsInts2D().isEmpty()) {

      // NOTE! MercatorUtil, not MercatorProjectionUtil which is wrong!!!
      // TODO: Fix MercatorProjectionUtil.getTileRect
      // tile boundary is is typical lat, lng coordinates
      Rectangle2D.Double tileBoundary = MercatorUtil.getTileRect(x, y, zoom);
      LOG.info("Tile boundary[{}, {}, {}, {}]",
               tileBoundary.getMinX(), tileBoundary.getMaxX(), tileBoundary.getMinY(), tileBoundary.getMaxY());
      Point2D tileBoundarySW = MercatorProjectionUtil.toNormalisedPixelCoords(tileBoundary.getMinY(), tileBoundary.getMinX());
      Point2D tileBoundaryNE =  MercatorProjectionUtil.toNormalisedPixelCoords(tileBoundary.getMaxY(), tileBoundary.getMaxX());
      LOG.info("Tile boundary in normalized[{}, {}, {},{}]",
               tileBoundarySW.getX(), tileBoundaryNE.getX(), tileBoundarySW.getY(), tileBoundaryNE.getY());

      // arrays for the RGB and alpha channels
      byte[] r = new byte[TILE_SIZE * TILE_SIZE];
      byte[] g = new byte[TILE_SIZE * TILE_SIZE];
      byte[] b = new byte[TILE_SIZE * TILE_SIZE];
      byte[] a = new byte[TILE_SIZE * TILE_SIZE];

      List<List<Integer>> countsInts = heatmapResponse.getCountsInts2D();

      // TODO: Remove, this is just to help us determine the tile pixel extents
      int x1 = 128,x2 = 128,y1 = 128,y2 = 128;

      // determine the pixels covered by the cell at the zoom level, and paint them
      for (int row = 0; row < countsInts.size(); row++) {
        if(countsInts.get(row) != null){
          for(int column = 0; column < countsInts.get(row).size(); column++) {
            Integer count = countsInts.get(row).get(column);
            if(count != null && count > 0) {

              final Rectangle2D.Double cell = new Rectangle2D.Double(heatmapResponse.getMinLng(column),
                                                            MercatorUtil.getLatInMercatorLimit(heatmapResponse.getMinLat(row)),
                                                            heatmapResponse.getMaxLng(column) - heatmapResponse.getMinLng(column),
                                                            MercatorUtil.getLatInMercatorLimit(heatmapResponse.getMaxLat(row)) - heatmapResponse.getMinLat(row));

              // get the extent of the cell in normalized pixelCoords, noting further South becomes maximum y
              Point2D cellSW = MercatorProjectionUtil.toNormalisedPixelCoords(cell.getMinY(), cell.getMinX());
              Point2D cellNE = MercatorProjectionUtil.toNormalisedPixelCoords(cell.getMaxY(), cell.getMaxX());

              // only paint if the cell falls on the tile (noting again higher Y means further south)
              if (cellNE.getX() >= tileBoundarySW.getX() && cellSW.getX() <= tileBoundaryNE.getX()
                && cellSW.getY() >= tileBoundaryNE.getY() && cellNE.getY() <= tileBoundarySW.getY()) {

                // clip normalized pixel locations to the edges of the cell
                double minXAsNorm = Math.max(cellSW.getX(), tileBoundarySW.getX());
                double maxXAsNorm = Math.min(cellNE.getX(), tileBoundaryNE.getX());
                double minYAsNorm = Math.max(cellNE.getY(), tileBoundaryNE.getY());
                double maxYAsNorm = Math.min(cellSW.getY(), tileBoundarySW.getY());

                // project normalized pixel locations onto offsets within the tile
                int minX = getOffsetX(minXAsNorm, zoom);
                int maxX = getOffsetX(maxXAsNorm, zoom);
                int minY = getOffsetY(minYAsNorm, y, zoom);
                int maxY = getOffsetY(maxYAsNorm, y, zoom);

                //LOG.info("X:{}-{}  Y:{},{}", minX, maxX, minY, maxY);

                // TODO: remove
                x1 = x1<minX ? x1 : minX;
                x2 = x2>maxX ? x2 : maxX;
                y1 = y1<minY ? y1 : minY;
                y2 = y2>maxY ? y2 : maxY;

                // paint the pixels identified
               for (int px = minX; px <= maxX; px++) {
                 for (int py = minY; py <= maxY; py++) {
                   paint(r,
                         g,
                         b,
                         a,
                         palette.red(count, zoom),
                         palette.green(count, zoom),
                         palette.blue(count, zoom),
                         palette.alpha(count, zoom),
                         px + (py * TILE_SIZE));
                 }
               }
              } else {
                //LOG.error("CellSW[{}] and CellNE[{}] falls outside the tileSW[{}] tileNE[{}]", cellSW, cellNE, tileBoundarySW, tileBoundaryNE);
              }

              // paint a tile perimeter for helping to DEBUG
              count = 10000000;
              for (int px = 5; px <= 250; px++) {
                for (int py = 5; py <= 250; py++) {

                  if (px == 5 || px == 250 || py == 5 || py == 250) {
                    paint(r,
                          g,
                          b,
                          a,
                          palette.red(count, zoom),
                          palette.green(count, zoom),
                          palette.blue(count, zoom),
                          palette.alpha(count, zoom),
                          px + (py * TILE_SIZE));
                  }
                }
              }
            }
          }
        }
      }

      // for some reason at Z=1 we see only 0-254 and z=2 0-252 etc.  Something weird.
      LOG.info("Final X:{}-{}  Y:{},{}", x1, x2, y1, y2);

      write(out, r, g, b, a);

    } else {
      // always return a valid image
      out.write(EMPTY_TILE);
    }
  }

  /**
   * @return the X pixel offset within the tile
   */
  public static int getOffsetX(double x, int zoom) {
    int scale = 1 << zoom;
    x *= scale * TILE_SIZE;
    return (int) (x % TILE_SIZE);
  }


  /**
   * @return the Y pixel offset within the tile.
   */
  public static int getOffsetY(double y, int tileY, int zoom) {
    int scale = 1 << zoom;
    y *= scale * TILE_SIZE;
    return (int) (y - (TILE_SIZE * tileY));
  }


  static class Chunk extends DataOutputStream {

    final CRC32 crc;
    final ByteArrayOutputStream baos;

    Chunk(int chunkType) throws IOException {
      this(chunkType, new ByteArrayOutputStream(), new CRC32());
    }

    private Chunk(int chunkType, ByteArrayOutputStream baos, CRC32 crc) throws IOException {
      super(new CheckedOutputStream(baos, crc));
      this.crc = crc;
      this.baos = baos;

      writeInt(chunkType);
    }

    public void writeTo(DataOutputStream out) throws IOException {
      flush();
      out.writeInt(baos.size() - 4);
      baos.writeTo(out);
      out.writeInt((int) crc.getValue());
    }
  }
}
