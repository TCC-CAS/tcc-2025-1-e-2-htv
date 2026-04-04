package com.devolva.use.payments.repository;

import com.devolva.use.payments.domain.PaymentModel;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository {
    PaymentModel save(PaymentModel payment);
    List<PaymentModel> findAll();
    Optional<PaymentModel> findById(Long id);
    void deleteById(Long id);
}