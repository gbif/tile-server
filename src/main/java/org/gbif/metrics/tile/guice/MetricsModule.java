package org.gbif.metrics.tile.guice;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

import com.google.inject.AbstractModule;
import com.yammer.metrics.guice.InstrumentationModule;
import com.yammer.metrics.reporting.GangliaReporter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Basic module to configure Yammer metrics for ganglia
 */
public class MetricsModule extends AbstractModule {

  private static final String PROPERTY_GANGLIA_SERVER = "ganglia.server";
  private final Properties properties;
  private static final Logger LOG = LoggerFactory.getLogger(MetricsModule.class);
  private static final int DEFAULT_GANGLIA_PORT = 8649;

  public MetricsModule(Properties properties) {
    this.properties = properties;

  }

  @Override
  protected void configure() {
    if (properties.getProperty(PROPERTY_GANGLIA_SERVER) == null) {
      LOG.warn("Attempt to install Ganglia metrics module when no property [" + PROPERTY_GANGLIA_SERVER + "] found.  Skipping");
    } else {

      install(new InstrumentationModule());
      Integer gangliaPort;
      try {
        gangliaPort = Integer.valueOf(properties.getProperty("ganglia.port"));
      } catch (NumberFormatException e) {
        LOG.warn("Ganlia port missing or invalid, defaulting to " + DEFAULT_GANGLIA_PORT);
        // default port
        gangliaPort = DEFAULT_GANGLIA_PORT;
      }
      try {
        if (properties.getProperty(PROPERTY_GANGLIA_SERVER) == null) {
          LOG.warn("Attempt to install Ganglia metrics module when no property [" + PROPERTY_GANGLIA_SERVER + "] found.  Skipping");
        } else {
          GangliaReporter.enable(1, TimeUnit.MINUTES, properties.getProperty(PROPERTY_GANGLIA_SERVER), gangliaPort);
        }
      } catch (Exception e) {
        LOG.warn("Failed to enable ganglia reporter: {}", e.getMessage());
      }
    }
  }
}
