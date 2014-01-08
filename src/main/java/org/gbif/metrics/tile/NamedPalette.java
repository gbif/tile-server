package org.gbif.metrics.tile;

/**
 * Enumeration of fixed color palettes.
 */
public enum NamedPalette {
  blues(DensityColorPaletteFactory.BLUES), greens(DensityColorPaletteFactory.GREENS), greys(
    DensityColorPaletteFactory.GREYS), oranges(DensityColorPaletteFactory.ORANGES), purples(
    DensityColorPaletteFactory.PURPLES), reds(DensityColorPaletteFactory.REDS), yellows_reds(
    DensityColorPaletteFactory.YELLOWS_REDS), diagnostic(DiagnosticDensityColorPalette.INSTANCE);

  private final ColorPalette pallete;

  private NamedPalette(ColorPalette p) {
    this.pallete = p;
  }

  public ColorPalette getPalette() {
    return pallete;
  }
}
