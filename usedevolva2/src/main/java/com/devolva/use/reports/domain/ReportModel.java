package com.devolva.use.reports.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
public class ReportModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long reporterId;
    private Long reportedUserId;
    private Long rentalId;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    @Column(columnDefinition = "TEXT")
    private String reportedMessages;


    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long resolvedById;

    private Long toolId;


    public ReportModel() {
        this.status = ReportStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }
}