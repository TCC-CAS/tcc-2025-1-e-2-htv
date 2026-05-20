package com.devolva.use.addresses;

import com.devolva.use.addresses.domain.AddressModel;
import com.devolva.use.addresses.dtos.CreateAddressDto;
import com.devolva.use.addresses.dtos.CepResponseDto;
import com.devolva.use.addresses.usecases.AddressUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
public class AddressController {

    private final AddressUsecases addressUsecases;

    public AddressController(AddressUsecases addressUsecases) {
        this.addressUsecases = addressUsecases;
    }

    @GetMapping("/users/{userId}/addresses")
    public ResponseEntity<?> list(@PathVariable Long userId) {
        return ResponseEntity.ok(addressUsecases.listByUser(userId));
    }

    @PostMapping("/users/{userId}/addresses")
    public ResponseEntity<?> create(
            @PathVariable Long userId,
            @RequestBody CreateAddressDto dto
    ) {
        AddressModel address = addressUsecases.create(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(address);
    }

    @PutMapping("/users/{userId}/addresses/{addressId}")
    public ResponseEntity<?> update(
            @PathVariable Long userId,
            @PathVariable Long addressId,
            @RequestBody CreateAddressDto dto
    ) {
        return ResponseEntity.ok(addressUsecases.update(userId, addressId, dto));
    }

    @PatchMapping("/users/{userId}/addresses/{addressId}/main")
    public ResponseEntity<?> setMain(
            @PathVariable Long userId,
            @PathVariable Long addressId
    ) {
        return ResponseEntity.ok(addressUsecases.setMain(userId, addressId));
    }

    @DeleteMapping("/users/{userId}/addresses/{addressId}")
    public ResponseEntity<?> delete(
            @PathVariable Long userId,
            @PathVariable Long addressId
    ) {
        addressUsecases.delete(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cep/{cep}")
    public ResponseEntity<CepResponseDto> findCep(@PathVariable String cep) {
        return ResponseEntity.ok(addressUsecases.findCep(cep));
    }
}