/**
 * 
 */
package org.gbif.metrics.tile;

import java.util.Map;
import java.util.Map.Entry;

import com.google.common.base.Objects;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Maps;


/**
 * Responsible for assigning the color and transparency (alpha) for a given count.
 */
public class DensityColorPalette implements ColorPalette {

  public static class Builder {

    private final Map<Range, byte[]> index = Maps.newHashMap();

    public Builder add(ColorRule r) {
      index.put(new Range(r.getMin(), r.getMax()), r.getColor());
      return this;
    }

    public DensityColorPalette build() {
      return new DensityColorPalette(index);
    }
  }

  /**
   * Utility class for building.
   */
  public static class ColorRule {

    private int min = Integer.MIN_VALUE;
    private int max = Integer.MAX_VALUE;
    private byte[] color = new byte[4]; // RGBA


    public ColorRule(Integer min, Integer max, byte[] color) {
      Preconditions.checkNotNull(color, "Color not supplied");
      Preconditions.checkArgument(color.length == 4, "Color needs to be the RGBA color space, but had [" + color.length
        + "] values");
      this.min = (min == null) ? this.min : min;
      this.max = (max == null) ? this.max : max;
      this.color = color;
    }

    public byte[] getColor() {
      return color;
    }

    public int getMax() {
      return max;
    }

    public int getMin() {
      return min;
    }
  }

  /**
   * Used for the index of color by range
   */
  private static class Range {

    private final int min;
    private final int max;

    public Range(int min, int max) {
      this.min = min;
      this.max = max;
    }

    @Override
    public boolean equals(Object object) {
      if (object instanceof Range) {
        Range that = (Range) object;
        return Objects.equal(this.min, that.min) && Objects.equal(this.max, that.max);
      }
      return false;
    }

    public int getMax() {
      return max;
    }

    public int getMin() {
      return min;
    }

    @Override
    public int hashCode() {
      return Objects.hashCode(min, max);
    }
  }

  private final Map<Range, byte[]> index;

  private DensityColorPalette(Map<Range, byte[]> index) {
    this.index = ImmutableMap.copyOf(index); // defensive copy
  }

  public byte alpha(int count, int zoom) {
    return color(count)[3]; // rgbA
  }

  public byte blue(int count, int zoom) {
    return color(count)[2]; // rgBa
  }

  // Looks up the color in the index
  private byte[] color(int count) throws IllegalArgumentException {
    for (Entry<Range, byte[]> e : index.entrySet()) {
      if (count >= e.getKey().getMin() && count < e.getKey().getMax()) {
        return e.getValue();
      }
    }
    // Invalid ruleset for this count
    throw new IllegalArgumentException("No color rule exists for count[" + count
      + "].  Perhaps you are missing 'catchall' rules for minimum and maximum?");
  }

  public byte green(int count, int zoom) {
    return color(count)[1]; // rGba
  }


  public byte red(int count, int zoom) {
    return color(count)[0]; // Rgba
  }
}
