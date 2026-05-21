package com.devolva.use.chats.dtos;

import java.util.List;

public record ChatDetailsDto(
        Long id,
        Long toolId,
        Long rentalId,
        Long ownerId,
        Long renterId,
        String otherUserName,
        String toolName,
        List<ChatMessageDto> messages
) {}