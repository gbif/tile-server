package org.gbif.metrics.tile;

import java.awt.Color;


/**
 * Emulates http://www.mapbox.com/blog/mapping-millions-of-dots/ by using a single hue (color) but varies
 * saturation and brightness on a logarithmic scale capping at 1000000, similar to the original GBIF 
 * yellow to red scale.
 */
public class HSBPalette implements ColorPalette {
  private static final double MAX = Math.log10(100000);
  
  
  public static final float HUE_PURPLE = 0.82f;
  public static final float HUE_YELLOW = 0.17f;
  public static final float HUE_BLUE = 0.58f;
  
  private final float hue;
  
  public HSBPalette(float hue) {
    this.hue = hue;
  }
  
  /**
   * Will use the default of purple if none supplied.
   */
  public HSBPalette() {
    this.hue = HUE_PURPLE;
  }
  
  
  @Override
  public byte alpha(int count, int zoom) {
    return (byte) 255; // always
  }
  
  /**
   * Basically this was chosen 
   */
  private Color getColor(int count, int zoom) {
    float f = Math.min(1.0f, (float) (Math.log10(count)/MAX));
    // 33% brightness drop for smaller counts
    float brightness = (1.0f - f) / 3;
    return new Color(Color.HSBtoRGB(hue, 1.0f - f, 1.0f - brightness));
  }
  
  
  @Override
  public byte red(int count, int zoom) {
    return (byte) getColor(count, zoom).getRed();
  }


  @Override
  public byte green(int count, int zoom) {
    
    return (byte) getColor(count, zoom).getGreen();
  }

  @Override
  public byte blue(int count, int zoom) {
    return (byte) getColor(count, zoom).getBlue();
  }
}
