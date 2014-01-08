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