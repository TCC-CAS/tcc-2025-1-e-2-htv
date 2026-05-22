package com.devolva.use.reports.dtos;

public record CreateReportDto(
        Long reporterId,
        Long reportedUserId,
        Long rentalId,
        String reason,
        String description
) {}