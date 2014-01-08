package org.gbif.metrics.tile;

import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.metrics.tile.DensityColorPalette.ColorRule;

import java.io.File;
import java.io.FileOutputStream;

import com.google.common.io.Closeables;

/**
 * This is a test harness useful when developing the PNGWriter.
 * This is not intended to be a unit test but simply an application that can be called
 * and generates a test PNG for visual inspection. Since this is really developer level
 * test code, it resides in the src/test/java directory. While one might argue this
 * should live in src/main it is really not anticipated to be used for anything other
 * than during changes to the PNGWriter itself for sanity checking.
 */
public class PNGWriterTest {

  private static final String DEFAULT_TARGET_DIR = "/tmp";
  private static final String TARGET_FILE = "test.png";
  private final static byte[] RED = new byte[] {(byte) 0xFF, (byte) 0x00, (byte) 0x00, (byte) 0xFF};
  private final static byte[] GREEN = new byte[] {(byte) 0x00, (byte) 0xFF, (byte) 0x00, (byte) 0xFF};
  private final static byte[] BLUE = new byte[] {(byte) 0x00, (byte) 0x00, (byte) 0xFF, (byte) 0xFF};

  /**
   * @param args If supplied the first should be the directory in which to write the tile.
   */
  public static void main(String[] args) {
    String targetDir = DEFAULT_TARGET_DIR;
    if (args != null && args.length > 0) {
      targetDir = args[0];
    }
    File d = new File(targetDir);
    if (!d.exists()) {
      d.mkdirs();
    }
    FileOutputStream fos = null;

    try {
      fos = new FileOutputStream(new File(d, TARGET_FILE));
      DensityTile t =
        DensityTile.builder(0, 0, 0, 16).collect(Layer.OBS_NO_YEAR, 45, -170, 1)
          .collect(Layer.OBS_NO_YEAR, -45, 170, 1000).build();
      DensityColorPalette p =
        new DensityColorPalette.Builder().add(new ColorRule(null, 10, RED)).add(new ColorRule(10, 100, GREEN))
          .add(new ColorRule(100, null, BLUE)).build();

      PNGWriter.write(t, fos, 0, p, Layer.OBS_NO_YEAR);

      fos.flush();
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      Closeables.closeQuietly(fos);
    }
  }
}
