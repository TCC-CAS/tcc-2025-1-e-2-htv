package com.devolva.use.chats.dtos;

public record SendChatMessageDto(
        Long senderId,
        String message
) {}