# GBIF Tile Server

GBIF Tile Server is a web application that provides map tiles, and a demonstration client library.

## Usage

To assist in development, there is an implementation of a memory backed cube which can be activated with a Maven profile.

The memory backed cube expects a GZipped CSV file containing latitude, longitude and numRecords, which is then read into memory and assembled into the cube.  This is not meant for production use, but only to assist those developing rendering services.

Example Maven profiles for the CSV method, or using HBase:

````xml
<profile>
  <id>tile-server-local-csv</id>
  <properties>
    <tile-server.cube.harness>csv-in-memory</tile-server.cube.harness>
    <tile-server.csv.location>src/test/resources/us-sampled.csv.gz</tile-server.csv.location>
    <tile-server.csv.numberOfZooms>4</tile-server.csv.numberOfZooms>
    <tile-server.csv.pixelsPerCluster>1</tile-server.csv.pixelsPerCluster>
  </properties>
</profile>

<profile>
  <id>tile-server-local</id>
  <properties>
    <tile-server.cube.harness>hbase</tile-server.cube.harness>
    <zookeeper.quorum>c1n1.gbif.org:2181,c1n2.gbif.org:2181,c1n3.gbif.org:2181</zookeeper.quorum>
    <hdfs.namenode>hdfs://c1n1.gbif.org:8020</hdfs.namenode>
    <density-cube.table>dev_maps_cube</density-cube.table>
  </properties>
</profile>
````

````shell
mvn -Ptile-server-local-csv jetty:run
mvn -Ptile-server-local jetty:run
````

Once started, try [this map](http://localhost:8080/map/?type=TAXON&key=1&layertype=png&style=dark&resolution=1).

## Acknowledgements

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications.

Take a look at YourKit's leading software products: <a href="http://www.yourkit.com/java/profiler/index.jsp">YourKit Java Profiler</a> and <a href="http://www.yourkit.com/.net/profiler/index.jsp">YourKit .NET Profiler</a>.

JetBrains is also a big supporter of open source projects and has kindly provided licenses for their fantastic IDE IntelliJ to GBIF. Learn more at <a href="http://www.jetbrains.com/idea/">the IntelliJ site</a>.
