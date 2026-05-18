package com.devolva.use.addresses.repository;

import com.devolva.use.addresses.domain.AddressModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<AddressModel, Long> {

    List<AddressModel> findByOwnerIdAndAtivoTrueOrderByPrincipalDescCreatedAtDesc(Long ownerId);

    boolean existsByOwnerIdAndAtivoTrue(Long ownerId);

    List<AddressModel> findByOwnerIdAndPrincipalTrueAndAtivoTrue(Long ownerId);
}