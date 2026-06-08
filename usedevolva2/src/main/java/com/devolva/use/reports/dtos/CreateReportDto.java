package com.devolva.use.reports.dtos;

public record CreateReportDto(
        Long reporterId,
        Long reportedUserId,
        Long toolId,
        Long rentalId,
        String reason,
        String reportedMessages,
        String description
) {}