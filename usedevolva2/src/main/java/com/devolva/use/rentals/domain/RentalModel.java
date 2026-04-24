package com.devolva.use.rentals.domain;

import com.devolva.use.rentals.domain.RentalStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class RentalModel {

    private Long id;
    private Long toolId;
    private Long ownerId;
    private Long tenantId;

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;

    private Double dailyRate;
    private Double baseValue;
    private Double serviceFee;
    private Double totalValue;
    private Double ownerNetValue;
    private Double lateFee;

    private RentalStatus status;

    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime paidAt;
    private LocalDateTime startedAt;
    private LocalDateTime returnedAt;

    private LocalDate actualReturnDate;
    private Long paymentId;

    public RentalModel() {
        this.lateFee = 0.0;
        this.status = RentalStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public RentalModel(Long id, Long toolId, Long ownerId, Long tenantId, LocalDate startDate, LocalDate endDate,
                       Integer totalDays, Double dailyRate, Double baseValue, Double serviceFee,
                       Double totalValue, Double ownerNetValue, Double lateFee, RentalStatus status,
                       LocalDateTime requestedAt, LocalDateTime respondedAt, LocalDateTime paidAt,
                       LocalDateTime startedAt, LocalDateTime returnedAt, LocalDate actualReturnDate, Long paymentId) {
        this.id = id;
        this.toolId = toolId;
        this.ownerId = ownerId;
        this.tenantId = tenantId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.dailyRate = dailyRate;
        this.baseValue = baseValue;
        this.serviceFee = serviceFee;
        this.totalValue = totalValue;
        this.ownerNetValue = ownerNetValue;
        this.lateFee = lateFee;
        this.status = status;
        this.requestedAt = requestedAt;
        this.respondedAt = respondedAt;
        this.paidAt = paidAt;
        this.startedAt = startedAt;
        this.returnedAt = returnedAt;
        this.actualReturnDate = actualReturnDate;
        this.paymentId = paymentId;
    }
}