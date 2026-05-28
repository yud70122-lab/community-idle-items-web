package com.community.idle.mq;

import com.alibaba.fastjson.JSON;
import com.community.idle.elasticsearch.ItemElasticsearchService;
import com.community.idle.model.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@RabbitListener(queues = ItemSyncProducer.QUEUE)
public class ItemSyncConsumer {

    private static final Logger logger = LoggerFactory.getLogger(ItemSyncConsumer.class);

    @Autowired
    private ItemElasticsearchService itemElasticsearchService;

    @RabbitHandler
    public void process(String message) {
        try {
            ItemSyncProducer.ItemSyncMessage syncMessage = 
                JSON.parseObject(message, ItemSyncProducer.ItemSyncMessage.class);
            
            logger.info("Receive item sync message: id={}, operation={}", 
                    syncMessage.getItemId(), syncMessage.getOperation());

            String operation = syncMessage.getOperation();
            String itemId = syncMessage.getItemId();

            switch (operation) {
                case "CREATE":
                case "UPDATE":
                    Item item = syncMessage.getItem();
                    if (item != null) {
                        if (!"online".equals(item.getStatus())) {
                            itemElasticsearchService.deleteById(itemId);
                            logger.info("Item offline, deleted from ES: {}", itemId);
                        } else {
                            itemElasticsearchService.saveOrUpdate(item);
                            logger.info("Item synced to ES: {}", itemId);
                        }
                    }
                    break;
                    
                case "DELETE":
                case "OFFLINE":
                    itemElasticsearchService.deleteById(itemId);
                    logger.info("Item deleted from ES: {}", itemId);
                    break;
                    
                default:
                    logger.warn("Unknown operation: {}", operation);
            }
            
        } catch (Exception e) {
            logger.error("Process item sync message failed", e);
        }
    }
}
