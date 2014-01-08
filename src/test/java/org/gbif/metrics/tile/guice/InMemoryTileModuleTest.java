package org.gbif.metrics.tile.guice;

import org.junit.Test;

import static org.junit.Assert.assertNotNull;

public class InMemoryTileModuleTest {

  @Test
  public void test() {
    InMemoryTileModule m = new InMemoryTileModule(InMemoryTileModuleTest.class.getResource("/us-sampled.csv.gz").getPath(), 1, 1);
    assertNotNull(m.getDensityCubeIO());
  }
}
