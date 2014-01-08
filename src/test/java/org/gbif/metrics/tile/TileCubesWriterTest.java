package org.gbif.metrics.tile;

import org.gbif.metrics.cube.tile.density.DensityTile;

import org.junit.Ignore;

import org.junit.Test;

import static org.junit.Assert.*;


public class TileCubesWriterTest {

  @Test
  @Ignore("This is incorrectly asserting the Y - still under discussion with the UI folks")
  public void testFromCellId() {
    // some cell locations
    int[][] tests = new int[][]{
      {0,0},
      {10,10},
      {12,1},
      {6,12},
    };
    
    // test all the above as an encode and decode for the following cluster sizes
    int[] clusterSizes = new int[]{1,2,4,8};
    
    for (int[] xy : tests) {
      for (int clusterSize : clusterSizes) {
        int[] result = TileCubesWriter.fromCellId(
          DensityTile.toCellId(xy[0], xy[1], clusterSize), clusterSize);
        
        // the result is not the same as the input because this addresses things for TileCube, which on a cluster size of 2
        // should have values of 0-128.  The DensityTile would address them as 0-256.  This is why there is the /clusterSize
        // in the test.
        assertEquals("X is incorrect for input x[" + xy[0] + "], y["
          + xy[0] + "], clusterSize[" + clusterSize + "]", xy[0] / clusterSize, result[0]);
        
        assertEquals("Y is incorrect for input x[" + xy[0] + "], y["
         + xy[1] + "], clusterSize[" + clusterSize + "]", 255 - xy[1] / clusterSize, result[1]);
      } 
    }
  }
}
