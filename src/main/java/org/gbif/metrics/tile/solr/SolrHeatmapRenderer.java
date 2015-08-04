package org.gbif.metrics.tile.solr;


import java.util.ArrayList;

import com.google.common.base.Strings;
import com.google.common.base.Throwables;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.util.NamedList;

/**
 *
 */
public class SolrHeatmapRenderer {

  public static class SolrHeatmapResponse {

    private Integer gridLevel;
    private Integer columns;
    private Integer rows;
    private Long count;
    private Double minX;
    private Double maxX;
    private Double minY;
    private Double maxY;
    private Double lengthX;
    private  Double lengthY;
    private ArrayList<ArrayList<Integer>> countsInts2D;

    public SolrHeatmapResponse(QueryResponse response, String ptrField) {
      NamedList heatmapSolrResponse = (NamedList)((NamedList)((NamedList)response.getResponse().get("facet_counts")).get("facet_heatmaps")).get(ptrField);
      gridLevel = (Integer)heatmapSolrResponse.get("gridLevel");
      columns = (Integer)heatmapSolrResponse.get("columns");
      count = response.getResults().getNumFound();
      rows = (Integer)heatmapSolrResponse.get("rows");
      minX = (Double)heatmapSolrResponse.get("minX");
      maxX = (Double)heatmapSolrResponse.get("maxX");
      minY = (Double)heatmapSolrResponse.get("minY");
      maxY = (Double)heatmapSolrResponse.get("maxY");
      countsInts2D = (ArrayList<ArrayList<Integer>>)heatmapSolrResponse.get("counts_ints2D");
      lengthX = (maxX - minX) / columns;
      lengthY = (maxY - minY) / rows;

    }
    public Integer getGridLevel() {
      return gridLevel;
    }

    public Integer getColumns() {
      return columns;
    }

    public Integer getRows() {
      return rows;
    }

    public Long getCount() {
      return count;
    }

    public Double getMinX() {
      return minX;
    }

    public Double getMaxX() {
      return maxX;
    }

    public Double getMinY() {
      return minY;
    }

    public Double getMaxY() {
      return maxY;
    }

    public Double getLengthX() {
      return lengthX;
    }

    public Double getLengthY() {
      return lengthY;
    }

    public ArrayList<ArrayList<Integer>> getCountsInts2D() {
      return countsInts2D;
    }

    public Double getMinLng(int column) {
      return minX + (lengthX * column);
    }

    public Double getMinLat(int row) {
      return maxY - (lengthY * row) - lengthY;
    }

    public Double getMaxLng(int column) {
      return minX + (lengthX * column) + lengthX;
    }

    public Double getMaxLat(int row) {
      return maxY - (lengthY * row);
    }

  }

   public static QueryResponse query(SolrClient solrClient, String query, String sptField, Integer gridLevel, String geom) {
     try {
       SolrQuery solrQuery = new SolrQuery(query);
       solrQuery.setFacet(true);
       solrQuery.add("facet.heatmap", sptField);
       if (!Strings.isNullOrEmpty(geom)) {
         solrQuery.add("facet.heatmap.geom", geom);
       }
       solrQuery.add("facet.heatmap.gridLevel", gridLevel.toString());
       return solrClient.query(solrQuery);
     } catch (Exception ex){
       Throwables.propagate(ex);
     }
     return null;
   }

  public static SolrHeatmapResponse uatQuery(){
    CloudSolrClient solrClient = new CloudSolrClient("c1n1.gbif.org:2181,c1n2.gbif.org:2181,c1n3.gbif.org:2181/solruat");
    solrClient.setDefaultCollection("uat_occurrence");
    QueryResponse response = query(solrClient,"*:*","coordinate",3,null);
    return new SolrHeatmapResponse(response,"coordinate");
  }
  public static void main(String[] args) {
    System.out.println(uatQuery());
  }
}
