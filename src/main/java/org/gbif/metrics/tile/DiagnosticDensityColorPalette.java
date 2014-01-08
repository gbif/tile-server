package org.gbif.metrics.tile;


/**
 * A class that simply maps the count to a color.  Thus you can reverse engineer from the color in the PNG to the count. 
 */
public class DiagnosticDensityColorPalette implements ColorPalette {
  
  private DiagnosticDensityColorPalette() {
  };
  
  public static DiagnosticDensityColorPalette INSTANCE = new DiagnosticDensityColorPalette();
  
  @Override
  public byte alpha(int count, int zoom) {
    return (byte) 0xff;
  }

  @Override
  public byte red(int count, int zoom) {
    return (byte) (0xFF & count>>16);
  }

  @Override
  public byte green(int count, int zoom) {
    return (byte) (0xFF & count>>8);
  }

  @Override
  public byte blue(int count, int zoom) {
    return (byte) (0xFF & count);
  }
}