package org.gbif.metrics.tile;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;


public class DensityColorPaletteFactoryTest {

  @Test
  public void testBuild() {
    // Reusing the simple RGB rule from the DensityColorPaletteTest
    DensityColorPalette p = DensityColorPaletteFactory.build(",10,#FF0000FF|10,100,#00FF00FF|100,,#0000FFFF");
    assertNotNull(p);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.RED, -1);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.RED, 0);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.RED, 9);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.GREEN, 10);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.GREEN, 99);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.BLUE, 100);
    DensityColorPaletteTest.assertSame(p, DensityColorPaletteTest.BLUE, 1000);
  }

  @Test
  public void testToRGBAByteArray() {
    byte[] r = DensityColorPaletteFactory.toRGBAByteArray("#FEEDDEFF");
    assertEquals(4, r.length);
    assertEquals((byte) 0xFE, r[0]);
    assertEquals((byte) 0xED, r[1]);
    assertEquals((byte) 0xDE, r[2]);
    assertEquals((byte) 0xFF, r[3]);

    try {
      DensityColorPaletteFactory.toRGBAByteArray("FEEDDEFF");
      fail("Invalid forms should exception");
    } catch (IllegalArgumentException e) {
    }
  }

}
