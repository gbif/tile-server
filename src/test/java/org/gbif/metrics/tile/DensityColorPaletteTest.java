package org.gbif.metrics.tile;

import org.gbif.metrics.tile.DensityColorPalette.ColorRule;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;


public class DensityColorPaletteTest {

  final static byte[] RED = new byte[] {(byte) 0xFF, (byte) 0x00, (byte) 0x00, (byte) 0xFF};
  final static byte[] GREEN = new byte[] {(byte) 0x00, (byte) 0xFF, (byte) 0x00, (byte) 0xFF};
  final static byte[] BLUE = new byte[] {(byte) 0x00, (byte) 0x00, (byte) 0xFF, (byte) 0xFF};

  static void assertSame(DensityColorPalette p, byte[] color, int count) {
    assertEquals(p.red(count, 0), color[0]);
    assertEquals(p.green(count, 0), color[1]);
    assertEquals(p.blue(count, 0), color[2]);
    assertEquals(p.alpha(count, 0), color[3]);
  }

  // basic functionality check
  @Test
  public void testAll() {

    DensityColorPalette p =
      new DensityColorPalette.Builder().add(new ColorRule(null, 10, RED)).add(new ColorRule(10, 100, GREEN))
        .add(new ColorRule(100, null, BLUE)).build();

    assertNotNull(p);
    assertSame(p, RED, -1);
    assertSame(p, RED, 0);
    assertSame(p, RED, 9);
    assertSame(p, GREEN, 10);
    assertSame(p, GREEN, 99);
    assertSame(p, BLUE, 100);
    assertSame(p, BLUE, 1000);

  }
}
