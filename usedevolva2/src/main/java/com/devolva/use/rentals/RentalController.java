package com.devolva.use.rentals;

import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.dtos.ApproveRentalDto;
import com.devolva.use.rentals.dtos.CreateRentalDto;
import com.devolva.use.rentals.dtos.ReturnRentalDto;
import com.devolva.use.rentals.dtos.StartRentalDto;
import com.devolva.use.rentals.usecases.RentalUsecases;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rentals")
public class RentalController {

    private final RentalUsecases rentalUsecases;

    public RentalController(RentalUsecases rentalUsecases) {
        this.rentalUsecases = rentalUsecases;
    }

    @PostMapping
    public RentalModel create(@RequestBody CreateRentalDto dto) {
        return rentalUsecases.createRentalRequest(dto);
    }

    @PutMapping("/{rentalId}/approval")
    public RentalModel approveOrReject(
            @PathVariable Long rentalId,
            @RequestBody ApproveRentalDto dto
    ) {
        return rentalUsecases.approveOrRejectRental(rentalId, dto);
    }

    @PutMapping("/{rentalId}/paid")
    public RentalModel markAsPaid(@PathVariable Long rentalId) {
        return rentalUsecases.markAsPaid(rentalId);
    }

    @PutMapping("/{rentalId}/start")
    public RentalModel startRental(
            @PathVariable Long rentalId,
            @RequestBody StartRentalDto dto
    ) {
        return rentalUsecases.startRental(rentalId, dto);
    }

    @PutMapping("/{rentalId}/return")
    public RentalModel returnRental(
            @PathVariable Long rentalId,
            @RequestBody ReturnRentalDto dto
    ) {
        return rentalUsecases.returnRental(rentalId, dto);
    }

    @GetMapping
    public List<RentalModel> findAll() {
        return rentalUsecases.findAll();
    }

    @GetMapping("/{rentalId}")
    public RentalModel findById(@PathVariable Long rentalId) {
        return rentalUsecases.findById(rentalId);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<RentalModel> findByTenantId(@PathVariable Long tenantId) {
        return rentalUsecases.findByTenantId(tenantId);
    }

    @GetMapping("/owner/{ownerId}")
    public List<RentalModel> findByOwnerId(@PathVariable Long ownerId) {
        return rentalUsecases.findByOwnerId(ownerId);
    }
}