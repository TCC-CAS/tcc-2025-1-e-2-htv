package com.devolva.use.chats.dtos;

public record ChatMessageDto(
        Long id,
        Long chatId,
        Long senderId,
        Long recipientId,
        String message,
        boolean automaticMessage,
        boolean readByRecipient,
        String createdAt
) {}