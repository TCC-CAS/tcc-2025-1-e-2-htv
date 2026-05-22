package com.devolva.use.reports.dtos;

public record ReportDetailsDto(
        Long id,
        String reporterName,
        String reportedUserName,
        Long toolId,
        String toolName,
        Long rentalId,
        String reason,
        String description,
        String status,
        String createdAt
) {}