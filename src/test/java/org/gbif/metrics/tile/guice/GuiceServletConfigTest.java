package org.gbif.metrics.tile.guice;

import org.gbif.metrics.tile.DensityTileRenderer;

import com.google.inject.Injector;
import org.junit.Test;

import static org.junit.Assert.assertNotNull;

public class GuiceServletConfigTest {

  @Test
  public void testGetInjector() {
    GuiceServletConfig c = new GuiceServletConfig();
    Injector i = c.getInjector();
    DensityTileRenderer d = i.getInstance(DensityTileRenderer.class);
    assertNotNull(d);
  }
}
