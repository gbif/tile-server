package org.gbif.metrics.tile;

import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;
import java.util.Map.Entry;
import java.util.zip.CRC32;
import java.util.zip.CheckedOutputStream;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;

import com.google.common.collect.Maps;
import com.google.common.io.Closeables;
import com.google.common.io.Closer;

/**
 * A highly optimized PNG tile writer for a DensityTile.
 */
public class PNGWriter {

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

  public static final byte[] EMPTY_TILE;

  // see the PNG specification
  private static final byte[] SIGNATURE = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
  private static final int IHDR = 0x49484452;
  private static final int IDAT = 0x49444154;
  private static final int IEND = 0x49454E44;
  private static final byte COLOR_TRUECOLOR_ALPHA = 6;
  private static final byte COMPRESSION_DEFLATE = 0;
  private static final byte FILTER_NONE = 0;
  private static final byte INTERLACE_NONE = 0;

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
    DataOutputStream dos = null;
    DeflaterOutputStream dfos = null;
    Chunk cIHDR = null;
    Chunk cIEND = null;
    try {
      dos = new DataOutputStream(os);
      dos.write(SIGNATURE);

      cIHDR = new Chunk(IHDR);
      cIHDR.writeInt(DensityTile.TILE_SIZE);
      cIHDR.writeInt(DensityTile.TILE_SIZE);
      cIHDR.writeByte(8); // 8 bit per component
      cIHDR.writeByte(COLOR_TRUECOLOR_ALPHA);
      cIHDR.writeByte(COMPRESSION_DEFLATE);
      cIHDR.writeByte(FILTER_NONE);
      cIHDR.writeByte(INTERLACE_NONE);
      cIHDR.writeTo(dos);

      Chunk cIDAT = new Chunk(IDAT);
      dfos = new DeflaterOutputStream(cIDAT, new Deflater(Deflater.BEST_COMPRESSION));

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

      cIEND = new Chunk(IEND);

      cIEND.writeTo(dos);
      dos.flush();

    } finally {
      Closeables.closeQuietly(cIHDR);
      Closeables.closeQuietly(cIEND);
      Closeables.closeQuietly(dfos);
      Closeables.closeQuietly(dos);
    }
  }
}