package com.devolva.use.payments.usecases;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.dtos.ConfirmPaymentDto;
import com.devolva.use.payments.dtos.CreatePaymentDto;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.repository.RentalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PaymentUsecases {

    private final PaymentRepository paymentRepository;
    private final RentalRepository rentalRepository;

    public PaymentUsecases(PaymentRepository paymentRepository, RentalRepository rentalRepository) {
        this.paymentRepository = paymentRepository;
        this.rentalRepository = rentalRepository;
    }

    public PaymentModel createPayment(CreatePaymentDto dto) {
        RentalModel rental = rentalRepository.findById(dto.rentalId())
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        if (rental.getStatus() != RentalStatus.AWAITING_PAYMENT) {
            throw new RuntimeException("A locação não está aguardando pagamento.");
        }

        PaymentModel payment = new PaymentModel();
        payment.setRentalId(rental.getId());
        payment.setGrossAmount(rental.getBaseValue());
        payment.setServiceFee(rental.getServiceFee());
        payment.setNetAmount(rental.getOwnerNetValue());
        payment.setPaymentMethod(dto.paymentMethod());
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepository.save(payment);
    }

    public PaymentModel confirmPayment(Long paymentId, ConfirmPaymentDto dto) {
        PaymentModel payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado."));

        payment.setTransactionId(dto.transactionId());
        payment.setStatus(PaymentStatus.CONFIRMED);
        payment.setConfirmedAt(LocalDateTime.now());

        RentalModel rental = rentalRepository.findById(payment.getRentalId())
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));

        rental.setStatus(RentalStatus.PAID);
        rental.setPaidAt(LocalDateTime.now());
        rentalRepository.save(rental);

        return paymentRepository.save(payment);
    }

    public PaymentModel failPayment(Long paymentId) {
        PaymentModel payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado."));

        payment.setStatus(PaymentStatus.FAILED);
        return paymentRepository.save(payment);
    }

    public PaymentModel findById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado."));
    }
}