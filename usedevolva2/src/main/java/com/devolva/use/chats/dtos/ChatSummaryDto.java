package com.devolva.use.chats.dtos;

public record ChatSummaryDto(
        Long id,
        Long toolId,
        Long rentalId,
        Long ownerId,
        Long renterId,
        String otherUserName,
        String otherUserProfileImageUrl,
        String toolName,
        String lastMessage,
        String updatedAt,
        long unreadCount
) {}