package org.gbif.metrics.tile;

import org.gbif.api.model.occurrence.search.HeatmapResponse;
import org.gbif.maps.MercatorUtil;
import org.gbif.metrics.cube.tile.MercatorProjectionUtil;
import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.common.parsers.geospatial.LatLngBoundingBox;

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
      int cellsPerRow = DensityTile.TILE_SIZE / tile.getClusterSize();
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

  /**
   * Writes the data to the stream as a PNG.
   */
  public static void write(HeatmapResponse heatmapResponse, OutputStream out, int zoom, int x, int y, ColorPalette palette)
    throws IOException {
    // don't waste time setting up PNG if no data
    if (heatmapResponse.getCountsInts2D() != null && !heatmapResponse.getCountsInts2D().isEmpty()) {

      // arrays for the RGB and alpha channels
      byte[] r = new byte[TILE_SIZE * TILE_SIZE];
      byte[] g = new byte[TILE_SIZE * TILE_SIZE];
      byte[] b = new byte[TILE_SIZE * TILE_SIZE];
      byte[] a = new byte[TILE_SIZE * TILE_SIZE];

      List<List<Integer>> countsInts = heatmapResponse.getCountsInts2D();
      // determine the pixels covered by the cell at the zoom level, and paint them
      for (int row = 0; row <  countsInts.size(); row++) {
        if(countsInts.get(row) != null){
          for(int column = 0; column < countsInts.get(row).size(); column++) {
            Integer count = countsInts.get(row).get(column);
            if(count != null && count > 0) {
              LatLngBoundingBox box = new LatLngBoundingBox(heatmapResponse.getMinLng(column),
                                                            MercatorUtil.getLatInMercatorLimit(heatmapResponse.getMinLat(
                                                              row)),
                                                            heatmapResponse.getMaxLng(column),
                                                            MercatorUtil.getLatInMercatorLimit(heatmapResponse.getMaxLat(
                                                              row)));
              // only paint if the cell is on the tile
              //if (intersect(box, cellExtent)) {

              // pixel locations for the edges of the cell
              int minX = MercatorProjectionUtil.getOffsetX(box.getMinLat(), box.getMinLong(), zoom);
              int maxX = MercatorProjectionUtil.getOffsetX(box.getMinLat(), box.getMaxLong(), zoom);
              // note Y inverts here
              int maxY = MercatorProjectionUtil.getOffsetY(box.getMinLat(), box.getMinLong(), zoom);
              int minY = MercatorProjectionUtil.getOffsetY(box.getMaxLat(), box.getMaxLong(), zoom);

                minX = minX < 0 ? 0 : minX;
                maxX = maxX < 0 ? 0 : maxX;
                minY = minY < 0 ? 0 : minY;
                maxY = maxY < 0 ? 0 : maxY;
                minX = minX > TILE_SIZE ? TILE_SIZE : minX;
                maxX = maxX > TILE_SIZE ? TILE_SIZE : maxX;
                minY = minY > TILE_SIZE ? TILE_SIZE : minY;
                maxY = maxY > TILE_SIZE ? TILE_SIZE : maxY;

                //LOG.info("{},{} to {},{}", maxX,maxY,minX,minY);
                //LOG.info("{} to {}", maxX  - minX , maxY - minY);


                 for (int px = minX; px <= maxX; px++) {
                   for (int py = maxY; py >= minY; py--) {
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

              //}
            }
          }
        }
      }
      write(out, r, g, b, a);

    } else {
      // always return a valid image
      out.write(EMPTY_TILE);
    }
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
