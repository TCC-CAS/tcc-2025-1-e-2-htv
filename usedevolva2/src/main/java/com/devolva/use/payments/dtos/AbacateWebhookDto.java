package com.devolva.use.payments.dtos;

import java.util.Map;

public record AbacateWebhookDto(
        String event,
        Map<String, Object> data
) {
}