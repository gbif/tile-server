package org.gbif.metrics.tile;

/**
 * The contract for controlling colors.
 */
public interface ColorPalette {
  public byte alpha(int count, int zoom);
  public byte red(int count, int zoom);
  public byte green(int count, int zoom);
  public byte blue(int count, int zoom);
  
}
