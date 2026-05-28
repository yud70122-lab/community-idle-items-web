package com.community.idle.elasticsearch;

import com.community.idle.model.Item;
import com.community.idle.model.User;
import com.community.idle.service.UserService;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.delete.DeleteResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.geo.GeoPoint;
import org.elasticsearch.common.text.Text;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.GeoDistanceQueryBuilder;
import org.elasticsearch.index.query.MatchPhraseQueryBuilder;
import org.elasticsearch.index.query.MultiMatchQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.index.query.RangeQueryBuilder;
import org.elasticsearch.index.query.TermQueryBuilder;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightField;
import org.elasticsearch.search.sort.FieldSortBuilder;
import org.elasticsearch.search.sort.ScoreSortBuilder;
import org.elasticsearch.search.sort.SortOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.alibaba.fastjson.JSON;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ItemElasticsearchService {

    private static final Logger logger = LoggerFactory.getLogger(ItemElasticsearchService.class);

    private static final String INDEX_NAME = "community_items";

    @Autowired
    private RestHighLevelClient elasticsearchClient;

    @Autowired
    private UserService userService;

    @Value("${elasticsearch.highlight.pre-tag:<span class=\"highlight-keyword\">}")
    private String highlightPreTag;

    @Value("${elasticsearch.highlight.post-tag:</span>}")
    private String highlightPostTag;

    public void saveOrUpdate(Item item) {
        try {
            Map<String, Object> source = buildDocument(item);
            
            IndexRequest request = new IndexRequest(INDEX_NAME)
                    .id(item.getId())
                    .source(source, XContentType.JSON);

            IndexResponse response = elasticsearchClient.index(request, RequestOptions.DEFAULT);
            logger.info("Item indexed to ES: {}, status: {}", item.getId(), response.status());
            
        } catch (Exception e) {
            logger.error("Index item to ES failed: {}", item.getId(), e);
            throw new RuntimeException("Index item failed", e);
        }
    }

    public void update(Item item) {
        try {
            Map<String, Object> source = buildDocument(item);
            
            UpdateRequest request = new UpdateRequest(INDEX_NAME, item.getId())
                    .doc(source, XContentType.JSON)
                    .docAsUpsert(true);

            UpdateResponse response = elasticsearchClient.update(request, RequestOptions.DEFAULT);
            logger.info("Item updated in ES: {}, status: {}", item.getId(), response.status());
            
        } catch (Exception e) {
            logger.error("Update item in ES failed: {}", item.getId(), e);
            throw new RuntimeException("Update item failed", e);
        }
    }

    public void deleteById(String id) {
        try {
            DeleteRequest request = new DeleteRequest(INDEX_NAME, id);
            DeleteResponse response = elasticsearchClient.delete(request, RequestOptions.DEFAULT);
            logger.info("Item deleted from ES: {}, status: {}", id, response.status());
            
        } catch (Exception e) {
            logger.error("Delete item from ES failed: {}", id, e);
            throw new RuntimeException("Delete item failed", e);
        }
    }

    public void bulkSave(List<Item> items) {
        try {
            BulkRequest bulkRequest = new BulkRequest();
            
            for (Item item : items) {
                Map<String, Object> source = buildDocument(item);
                IndexRequest request = new IndexRequest(INDEX_NAME)
                        .id(item.getId())
                        .source(source, XContentType.JSON);
                bulkRequest.add(request);
            }

            BulkResponse response = elasticsearchClient.bulk(bulkRequest, RequestOptions.DEFAULT);
            
            if (response.hasFailures()) {
                logger.error("Bulk index has failures: {}", response.buildFailureMessage());
                throw new RuntimeException("Bulk index failed");
            }
            
            logger.info("Bulk indexed {} items to ES", items.size());
            
        } catch (Exception e) {
            logger.error("Bulk index items to ES failed", e);
            throw new RuntimeException("Bulk index failed", e);
        }
    }

    public Map<String, Object> search(String keyword, int page, int pageSize,
                                       Double minPrice, Double maxPrice,
                                       String condition, String tradeType,
                                       String categoryId, String sortType,
                                       Double userLat, Double userLon, Double distance) {
        try {
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();

            if (keyword != null && !keyword.trim().isEmpty()) {
                BoolQueryBuilder shouldQuery = QueryBuilders.boolQuery();
                shouldQuery.minimumShouldMatch(1);

                MultiMatchQueryBuilder multiMatch = QueryBuilders.multiMatchQuery(keyword)
                        .field("title", 3.0f)
                        .field("title.pinyin", 2.0f)
                        .field("description", 1.5f)
                        .field("tags", 2.0f)
                        .field("category", 1.5f)
                        .field("location", 1.0f)
                        .field("seller.nickname", 1.0f)
                        .type(MultiMatchQueryBuilder.Type.BEST_FIELDS)
                        .analyzer("ik_smart")
                        .minimumShouldMatch("80%");
                shouldQuery.should(multiMatch);

                MatchPhraseQueryBuilder phraseQuery = QueryBuilders.matchPhraseQuery("title", keyword)
                        .boost(5.0f)
                        .slop(2);
                shouldQuery.should(phraseQuery);

                TermQueryBuilder tagQuery = QueryBuilders.termQuery("tags.keyword", keyword)
                        .boost(4.0f);
                shouldQuery.should(tagQuery);

                boolQuery.must(shouldQuery);
            }

            boolQuery.filter(QueryBuilders.termQuery("status", "online"));

            if (minPrice != null || maxPrice != null) {
                RangeQueryBuilder priceRange = QueryBuilders.rangeQuery("price");
                if (minPrice != null) {
                    priceRange.gte(minPrice);
                }
                if (maxPrice != null) {
                    priceRange.lte(maxPrice);
                }
                boolQuery.filter(priceRange);
            }

            if (condition != null && !condition.isEmpty()) {
                boolQuery.filter(QueryBuilders.termQuery("condition", condition));
            }

            if (tradeType != null && !tradeType.isEmpty()) {
                boolQuery.filter(QueryBuilders.termQuery("tradeType", tradeType));
            }

            if (categoryId != null && !categoryId.isEmpty()) {
                boolQuery.filter(QueryBuilders.termQuery("categoryId", categoryId));
            }

            if (userLat != null && userLon != null && distance != null) {
                GeoDistanceQueryBuilder geoQuery = QueryBuilders.geoDistanceQuery("geoPoint")
                        .point(userLat, userLon)
                        .distance(distance + "km");
                boolQuery.filter(geoQuery);
            }

            sourceBuilder.query(boolQuery);

            HighlightBuilder highlightBuilder = new HighlightBuilder();
            highlightBuilder.preTags(highlightPreTag);
            highlightBuilder.postTags(highlightPostTag);
            highlightBuilder.requireFieldMatch(false);
            
            highlightBuilder.field("title").numOfFragments(0);
            highlightBuilder.field("description").numOfFragments(1).fragmentSize(100);
            highlightBuilder.field("tags").numOfFragments(0);
            
            sourceBuilder.highlighter(highlightBuilder);

            if ("price_asc".equals(sortType)) {
                sourceBuilder.sort(new FieldSortBuilder("price").order(SortOrder.ASC));
            } else if ("price_desc".equals(sortType)) {
                sourceBuilder.sort(new FieldSortBuilder("price").order(SortOrder.DESC));
            } else if ("latest".equals(sortType)) {
                sourceBuilder