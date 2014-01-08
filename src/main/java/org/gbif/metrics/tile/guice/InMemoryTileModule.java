package org.gbif.metrics.tile.guice;

import org.gbif.metrics.cube.tile.density.DensityCube;
import org.gbif.metrics.cube.tile.density.DensityTile;
import org.gbif.metrics.cube.tile.density.Layer;
import org.gbif.metrics.cube.tile.io.TileContentType;
import org.gbif.metrics.cube.tile.point.PointCube;
import org.gbif.metrics.cube.tile.point.PointTile;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Set;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;

import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import com.google.inject.spi.Message;
import com.urbanairship.datacube.BoxedByteArray;
import com.urbanairship.datacube.DataCubeIo;
import com.urbanairship.datacube.DbHarness;
import com.urbanairship.datacube.DbHarness.CommitType;
import com.urbanairship.datacube.IdService;
import com.urbanairship.datacube.SyncLevel;
import com.urbanairship.datacube.WriteBuilder;
import com.urbanairship.datacube.dbharnesses.MapDbHarness;
import com.urbanairship.datacube.idservices.CachingIdService;
import com.urbanairship.datacube.idservices.MapIdService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Useful for local development, a module that takes a gzipped csv file location containing
 * lat,lng,count and creates a memory cube with the overwrite commit type. This can take a while
 * to start, depending on the file size.
 */
public class InMemoryTileModule extends AbstractModule {

  private static final Logger LOG = LoggerFactory.getLogger(InMemoryTileModule.class);
  private final String fileLocation;
  private final int numZooms;
  private final int pixelsPerCluster;

  private final DataCubeIo<DensityTile> densityCubeIo;


  public InMemoryTileModule(String fileLocation, int numberZooms, int pixelsPerCluster) {
    this.fileLocation = fileLocation;
    this.numZooms = numberZooms;
    this.pixelsPerCluster = pixelsPerCluster;
    ConcurrentMap<BoxedByteArray, byte[]> backingMap = Maps.newConcurrentMap();
    IdService idService = new CachingIdService(4, new MapIdService(), "id");
    DbHarness<DensityTile> densityDbHarness =
      new MapDbHarness<DensityTile>(backingMap, DensityTile.DESERIALIZER, CommitType.OVERWRITE, idService);
    densityCubeIo =
      new DataCubeIo<DensityTile>(DensityCube.INSTANCE, densityDbHarness, 1, Long.MAX_VALUE, SyncLevel.FULL_SYNC);
  }

  @Override
  protected void configure() {
    try {
      loadCSV();
    } catch (FileNotFoundException e) {
      this.addError(new Message("CSV file not found"));

    } catch (Exception e) {
      this.addError(new Message(e.getMessage()));
    }
  }

  @Singleton
  @Provides
  public DataCubeIo<DensityTile> getDensityCubeIO() {
    return densityCubeIo;
  }

  private void loadCSV() throws FileNotFoundException, IOException, InterruptedException {
    // load in some mock data
    BufferedReader br =
      new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream(fileLocation))));
    Pattern tab = Pattern.compile(",");
    br.readLine(); // skip header
    String line = br.readLine();

    // We need to collect for each tile addressable at each zoom level
    Set<DensityTile.Builder> densityBuilders = Sets.newHashSet();
    Set<PointTile.Builder> pointBuilders = Sets.newHashSet();
    for (int z = 0; z <numZooms ; z++) {
      // number of tiles addresses per axis at this zoom
      int n = 2 << z;
      for (int x = 0; x < n; x++) {
        for (int y = 0; y < n; y++) {
          densityBuilders.add(DensityTile.builder(z, x, y, pixelsPerCluster));
          pointBuilders.add(PointTile.builder(z, x, y));
        }
      }
    }
    int count = 0;
    while (line != null) {
      if (++count % 1000 == 0) {
        LOG.debug("CSV lines read {}", count);
      }

      if (!line.contains("N")) { // ignore nulls
        String[] atoms = tab.split(line.replaceAll("\"", ""));
        double lat = Double.parseDouble(atoms[0]);
        double lng = Double.parseDouble(atoms[1]);
        int cnt = Integer.parseInt(atoms[2]);
        for (DensityTile.Builder b : densityBuilders) {
          b.collect(Layer.OBS_NO_YEAR, lat, lng, cnt);
        }
      }
      line = br.readLine();
    }
    br.close();

    for (DensityTile.Builder b : densityBuilders) {
      DensityTile t = b.build();
      densityCubeIo.writeSync(
        t,
        new WriteBuilder(DensityCube.INSTANCE).at(DensityCube.TYPE, TileContentType.TAXON).at(DensityCube.KEY, "1")
          .at(DensityCube.ZOOM, b.getZoom()).at(DensityCube.TILE_X, b.getX()).at(DensityCube.TILE_Y, b.getY()));
    }
    densityCubeIo.flush();
  }
}
