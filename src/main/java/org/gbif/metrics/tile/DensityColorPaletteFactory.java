package org.gbif.metrics.tile;

import org.gbif.metrics.tile.DensityColorPalette.ColorRule;

import java.util.regex.Pattern;

import javax.xml.bind.annotation.adapters.HexBinaryAdapter;

import com.google.common.cache.Cache;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Preconditions;
import com.google.common.cache.CacheBuilder;


/**
 * Utilities to provide a color palette from the encoded form found in the url.
 * 
 * The encoding form is a series of rules separated by the pipe (|) character.
 * Each rule has 3 components (min,max,color) separated by commas (,).  The 
 * min and max may be omitted to supply "catch all greater/less than rules".
 * The format of the colors is RGBA hex with a preceding # symbol.  An example rule
 * format might therefore be: ,10,#FF0000FF|10,100,#00FF00FF|100,,#0000FFFF 
 * <p/>  
 * This class makes use of caching, as it is often the case that repeated calls for the 
 * same palette will be observed.
 * Defaults are provided using schemes found in http://colorbrewer2.org
 */
public class DensityColorPaletteFactory {

  // Utility to provide hex string to bytes
  private static final HexBinaryAdapter adapter = new HexBinaryAdapter();
  // For parsing the strings
  private static final Pattern COMMA = Pattern.compile(",");
  private static final Pattern PIPE = Pattern.compile("\\|");
  private static final Cache<String, DensityColorPalette> CACHE = 
    CacheBuilder.newBuilder().maximumSize(100).<String, DensityColorPalette>build();


  // Defaults are provided using schemes found in http://colorbrewer2.org
  // Note that the transparency is added in the defaultFrom
  public static final DensityColorPalette BLUES = defaultFrom(
    "#EFF3FF", "#C6DBEF", "#9ECAE1", "#6BAED6", "#3182BD", "#08519C");
  public static final DensityColorPalette GREENS = defaultFrom(
    "#EDF8E9", "#C7E9C0", "#A1D99B", "#74C476", "#31A354", "#006D2C");
  public static final DensityColorPalette GREYS = defaultFrom(
    "#F7F7F7", "#D9D9D9", "#BDBDBD", "#969696", "#636363", "#252525");
  public static final DensityColorPalette ORANGES = defaultFrom(
    "#FEEDDE", "#FDD0A2", "#FDAE6B", "#FD8D3C", "#E6550D", "#A63603");
  public static final DensityColorPalette PURPLES = defaultFrom(
    "#F2F0F7", "#DADAEB", "#BCBDDC", "#9E9AC8", "#756BB1", "#54278F");
  public static final DensityColorPalette REDS = defaultFrom(
    "#FEE5D9", "#FCBBA1", "#FC9272", "#FB6A4A", "#DE2D26", "#A50F15");
  // The classical yellow to red GBIF have been using for years
  public static final DensityColorPalette YELLOWS_REDS = defaultFrom(
    "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#CC0000");
  
  
  /**
   * Returns a DensityColorPallete for the provided rules.
   * 
   * @param encoded In the format of min,max,#color|min,max,#color
   * @return The density color palette or the default
   * @throws IllegalArgumentException Should the encoded string be unparsable.
   */
  public static DensityColorPalette build(String encoded) throws IllegalArgumentException {
    DensityColorPalette p = CACHE.getIfPresent(encoded);
    // has potential for race conditions, but not considered an issue
    if (p == null) {
      DensityColorPalette.Builder b = new DensityColorPalette.Builder();
      for (String rule : PIPE.split(encoded)) {
        String[] atoms = COMMA.split(rule);
        Preconditions.checkNotNull(atoms);
        Preconditions.checkArgument(3 == atoms.length, "Rules form invalid.  Expected [min,max,color] " +
        		"such as [0,10,#FF0000FF] found[" + rule + "]");
        
        Integer min = (atoms[0].length() == 0) ? null : Integer.parseInt(atoms[0]);
        Integer max = (atoms[1].length() == 0) ? null : Integer.parseInt(atoms[1]);
        b.add(new ColorRule(min, max, toRGBAByteArray(atoms[2])));      
      }
      p = b.build();
      CACHE.put(encoded, p);
    } 
    
    return p;
  }

  /**
   * Utility to convert from a single hex form into bytes representing RGBA.
   * 0xFEEDDEFF becomes [FE, ED, DE, FF] for example.
   */
  @VisibleForTesting
  static byte[] toRGBAByteArray(String hex) {
    Preconditions.checkArgument(hex != null && hex.length() == 9,
      "NamedPalette need to be defined in #RGBA form (E.g. #FEEDDEFF).  Provided: " + hex);
    return adapter.unmarshal(hex.substring(1, 9));
  }
  
  @VisibleForTesting
  static DensityColorPalette defaultFrom(String... cols) {
    Preconditions.checkArgument(cols != null && cols.length == 6,
      "6 default colors need to be defined in #RGBA form (E.g. #FEEDDEFF)");
    // adding the transparency here
    return new DensityColorPalette.Builder()
      .add(new DensityColorPalette.ColorRule(null, 1, toRGBAByteArray("#00000000"))) // hidden
      .add(new DensityColorPalette.ColorRule(1, 10, toRGBAByteArray(cols[0] + "FF")))
      .add(new DensityColorPalette.ColorRule(10, 100, toRGBAByteArray(cols[1]+ "FF")))
      .add(new DensityColorPalette.ColorRule(100, 1000, toRGBAByteArray(cols[2]+ "FF")))
      .add(new DensityColorPalette.ColorRule(1000, 10000, toRGBAByteArray(cols[3]+ "FF")))
      .add(new DensityColorPalette.ColorRule(10000, 100000, toRGBAByteArray(cols[4]+ "FF")))
      .add(new DensityColorPalette.ColorRule(100000, null, toRGBAByteArray(cols[5]+ "FF")))      
      .build();    
  }  
}
