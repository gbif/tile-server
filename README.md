tile-server
===========

Tile-server is a web application that provides map tiles, and a demonstration client library.

To run this project, simply run using a profile supplied in the project pom (or create your own)
  mvn jetty:run -Pstaging

you might consider looking at something like this once started:
  http://localhost:8080/demo/index.html?type=TAXON&key=1&layertype=png&style=dark&resolution=1

FOR DEVELOPERS (advanced use only):
To assist in development, there is an implementation of a memory backed cube which can be activated in the application.properties.
Please see the example in /conf which has detailed comments.  The memory backed cube expects a GZipped CSV file containing latitude,
longitude and numRecords, which is then read into memory and assembled into the cube.  This is not meant for production use, but only
to assist those developing rendering services.

Acknowledgements
----------------
YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications.

Take a look at YourKit's leading software products: <a href="http://www.yourkit.com/java/profiler/index.jsp">YourKit Java Profiler</a> and <a href="http://www.yourkit.com/.net/profiler/index.jsp">YourKit .NET Profiler</a>.

JetBrains is also a big supporter of open source projects and has kindly provided licenses for their fantastic IDE IntelliJ to GBIF. Learn more at <a href="http://www.jetbrains.com/idea/">the IntelliJ site</a>.
