package com.community.idle.mq;

import com.alibaba.fastjson.JSON;
import com.community.idle.model.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ItemSyncProducer {

    private static final Logger logger = LoggerFactory.getLogger(ItemSyncProducer.class);

    public static final String EXCHANGE = "item.sync.exchange";
    public static final String ROUTING_KEY = "item.sync";
    public static final String QUEUE = "item.sync.queue";

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${mq.item.sync.enabled:true}")
    private boolean enabled;

    public void sendSyncMessage(Item item, String operation) {
        if (!enabled) {
            return;
        }

        try {
            ItemSyncMessage message = new ItemSyncMessage();
            message.setItemId(item.getId());
            message.setOperation(operation);
            message.setTimestamp(System.currentTimeMillis());
            
            if (!"DELETE".equals(operation)) {
                message.setItem(item);
            }

            String json = JSON.toJSONString(message);
            rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, json);
            
            logger.info("Send item sync message: id={}, operation={}", item.getId(), operation);
        } catch (Exception e) {
            logger.error("Send item sync message failed", e);
        }
    }

    public static class ItemSyncMessage {
        private String itemId;
        private String operation;
        private long timestamp;
        private Item item;

        public String getItemId() {
            return itemId;
        }

        public void setItemId(String itemId) {
            this.itemId = itemId;
        }

        public String getOperation() {
            return operation;
        }

        public void setOperation(String operation) {
            this.operation = operation;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }

        public Item getItem() {
            return item;
        }

        public void setItem(Item item) {
            this.item = item;
        }
    }
}
