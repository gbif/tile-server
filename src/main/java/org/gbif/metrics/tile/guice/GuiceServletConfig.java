package org.gbif.metrics.tile.guice;

import org.gbif.metrics.cube.tile.density.guice.DensityCubeHBaseModule;
import org.gbif.metrics.tile.DensityTileRenderer;

import java.io.IOException;
import java.util.List;
import java.util.Properties;

import com.google.common.base.Joiner;
import com.google.common.collect.Lists;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.servlet.GuiceServletContextListener;
import com.google.inject.servlet.ServletModule;
import com.yammer.metrics.guice.InstrumentationModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Sets up the rendering Servlet, and the Cube injection.
 * This can operate in 2 modes:
 * i) Using a memory cube, that reads from a GZipped CSV file with lat,lng,count (for local testing)
 * ii) Using an HBase backed cube (for real operation)
 */
public class GuiceServletConfig extends GuiceServletContextListener {

  private static final Logger LOG = LoggerFactory.getLogger(GuiceServletConfig.class);
  private static final String APPLICATION_PROPERTIES = "/application.properties";
  private static final String PROP_STORAGE_TYPE = "tile-server.cube.harness";
  private static final String PROP_CSV = "tile-server.csv.location";
  private static final String PROP_ZOOMS = "tile-server.csv.numberOfZooms";
  private static final String PROP_PIXELS_PER_CLUSTER = "tile-server.csv.pixelsPerCluster";
  private static final String TYPE_CSV_MEMORY = "csv-in-memory";
  private static final String TYPE_HBASE = "hbase";
  private static final int DEFAULT_ZOOMS = 1; // for some sanity
  private static final int DEFAULT_PIXELS_PER_CLUSTER = 4; // for some sanity

  @Override
  protected Injector getInjector() {
    Properties p = new Properties();
    try {
      p.load(GuiceServletConfig.class.getResourceAsStream(APPLICATION_PROPERTIES));
    } catch (IOException e) {
      throw new IllegalArgumentException(APPLICATION_PROPERTIES + " is missing");
    }

    List<Module> modules = Lists.newArrayList();
    modules.add(new InstrumentationModule());
    modules.add(new MetricsModule(p));
    if (TYPE_CSV_MEMORY.equals(p.getProperty(PROP_STORAGE_TYPE))) {
      LOG.info("Configuration declares a CSV in-memory DataCube");
      int zooms = getInt(p, PROP_ZOOMS, DEFAULT_ZOOMS);
      int pixelsPerCluster = getInt(p, PROP_PIXELS_PER_CLUSTER, DEFAULT_PIXELS_PER_CLUSTER);
      modules.add(new InMemoryTileModule(p.get(PROP_CSV).toString(), zooms, pixelsPerCluster));
    } else if (TYPE_HBASE.equals(p.getProperty(PROP_STORAGE_TYPE))) {
      LOG.info("Configuration declares an HBase backed DataCube");
      modules.add(new DensityCubeHBaseModule(p));
    } else {
      throw new RuntimeException(PROP_STORAGE_TYPE + " is not a valid.  Use one of " + Joiner.on(",").join(TYPE_CSV_MEMORY, TYPE_HBASE));
    }
    modules.add(new ServletModule() {

      @Override
      protected void configureServlets() {
        serve("/density/*").with(DensityTileRenderer.class);
      }
    });

    return Guice.createInjector(modules);
  }

  private int getInt(Properties p, String key, int defaultValue) {
    try {
      return (p.getProperty(key) == null) ? defaultValue : Integer.parseInt(p.getProperty(key));
    } catch (NumberFormatException e1) {
      return defaultValue;
    }
  }
}
