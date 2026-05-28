package com.community.idle.canal;

import com.alibaba.otter.canal.client.CanalConnector;
import com.alibaba.otter.canal.client.CanalConnectors;
import com.alibaba.otter.canal.protocol.CanalEntry;
import com.alibaba.otter.canal.protocol.Message;
import com.community.idle.elasticsearch.ItemElasticsearchService;
import com.community.idle.model.Item;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class CanalItemListener implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(CanalItemListener.class);

    @Value("${canal.host:127.0.0.1}")
    private String canalHost;

    @Value("${canal.port:11111}")
    private int canalPort;

    @Value("${canal.destination:example}")
    private String destination;

    @Value("${canal.username:}")
    private String username;

    @Value("${canal.password:}")
    private String password;

    @Value("${canal.subscribe:community_idle.item}")
    private String subscribe;

    @Autowired
    private ItemElasticsearchService itemElasticsearchService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile boolean running = false;

    @Override
    public void run(ApplicationArguments args) {
        startListener();
    }

    public void startListener() {
        if (running) {
            return;
        }
        running = true;

        new Thread(() -> {
            CanalConnector connector = CanalConnectors.newSingleConnector(
                    new InetSocketAddress(canalHost, canalPort),
                    destination,
                    username,
                    password
            );

            int batchSize = 1000;
            try {
                connector.connect();
                connector.subscribe(subscribe);
                logger.info("Canal connected, subscribe: {}", subscribe);

                while (running) {
                    try {
                        Message message = connector.getWithoutAck(batchSize);
                        long batchId = message.getId();
                        int size = message.getEntries().size();

                        if (batchId == -1 || size == 0) {
                            Thread.sleep(1000);
                            continue;
                        }

                        processEntry(message.getEntries());
                        connector.ack(batchId);

                    } catch (Exception e) {
                        logger.error("Process canal message error", e);
                        connector.rollback();
                        Thread.sleep(5000);
                    }
                }
            } catch (InterruptedException e) {
                logger.warn("Canal listener interrupted", e);
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                logger.error("Canal listener error", e);
            } finally {
                connector.disconnect();
                running = false;
                logger.info("Canal listener stopped");
            }
        }, "canal-item-listener").start();
    }

    private void processEntry(List<CanalEntry.Entry> entries) {
        for (CanalEntry.Entry entry : entries) {
            if (entry.getEntryType() == CanalEntry.EntryType.TRANSACTIONBEGIN ||
                entry.getEntryType() == CanalEntry.EntryType.TRANSACTIONEND) {
                continue;
            }

            if (entry.getEntryType() != CanalEntry.EntryType.ROWDATA) {
                continue;
            }

            try {
                CanalEntry.RowChange rowChange = CanalEntry.RowChange.parseFrom(entry.getStoreValue());
                CanalEntry.EventType eventType = rowChange.getEventType();

                logger.info("Table: {}.{}, EventType: {}",
                        entry.getHeader().getSchemaName(),
                        entry.getHeader().getTableName(),
                        eventType);

                for (CanalEntry.RowData rowData : rowChange.getRowDatasList()) {
                    switch (eventType) {
                        case INSERT:
                        case UPDATE:
                            handleInsertOrUpdate(rowData.getAfterColumnsList());
                            break;
                        case DELETE:
                            handleDelete(rowData.getBeforeColumnsList());
                            break;
                        default:
                            logger.warn("Unhandled event type: {}", eventType);
                    }
                }
            } catch (Exception e) {
                logger.error("Process entry error", e);
            }
        }
    }

    private void handleInsertOrUpdate(List<CanalEntry.Column> columns) {
        Map<String, Object> data = columnsToMap(columns);
        
        if (!"online".equals(data.get("status"))) {
            Object id = data.get("id");
            if (id != null) {
                itemElasticsearchService.deleteById(String.valueOf(id));
                logger.info("Item offline, deleted from ES: {}", id);
            }
            return;
        }

        Item item = mapToItem(data);
        itemElasticsearchService.saveOrUpdate(item);
        logger.info("Item synced to ES: {}", item.getId());
    }

    private void handleDelete(List<CanalEntry.Column> columns) {
        Map<String, Object> data = columnsToMap(columns);
        Object id = data.get("id");
        if (id != null) {
            itemElasticsearchService.deleteById(String.valueOf(id));
            logger.info("Item deleted from ES: {}", id);
        }
    }

    private Map<String, Object> columnsToMap(List<CanalEntry.Column> columns) {
        Map<String, Object> map = new HashMap<>();
        for (CanalEntry.Column column : columns) {
            String name = column.getName();
            String value = column.getValue();
            if (column.getIsNull()) {
                map.put(name, null);
            } else {
                map.put(name, value);
            }
        }
        return map;
    }

    private Item mapToItem(Map<String, Object> data) {
        Item item = new Item();
        item.setId(getString(data, "id"));
        item.setTitle(getString(data, "title"));
        item.setDescription(getString(data, "description"));
        item.setCategory(getString(data, "category"));
        item.setCategoryId(getString(data, "category_id"));
        item.setTags(getString(data, "tags"));
        item.setPrice(getDouble(data, "price"));
        item.setOriginalPrice(getDouble(data, "original_price"));
        item.setCondition(getString(data, "condition"));
        item.setTradeType(getString(data, "trade_type"));
        item.setStatus(getString(data, "status"));
        item.setCoverImage(getString(data, "cover_image"));
        item.setImages(getString(data, "images"));
        item.setPanoramaImage(getString(data, "panorama_image"));
        item.setUserId(getString(data, "user_id"));
        item.setLocation(getString(data, "location"));
        item.setAddress(getString(data, "address"));
        item.setLatitude(getDouble(data, "latitude"));
        item.setLongitude(getDouble(data, "longitude"));
        item.setViewCount(getInteger(data, "view_count"));
        item.setFavoriteCount(getInteger(data, "favorite_count"));
        item.setCreateTime(getLong(data, "create_time"));
        item.setUpdateTime(getLong(data, "update_time"));
        
        return item;
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? String.valueOf(value) : null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public void stopListener() {
        running = false;
    }
}
