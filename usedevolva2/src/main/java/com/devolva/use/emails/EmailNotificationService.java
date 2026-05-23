package com.devolva.use.emails;

import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

@Service
public class EmailNotificationService {

    private final EmailService emailService;
    private final UserRepository userRepository; // Injete o repositório

    public EmailNotificationService(EmailService emailService, UserRepository userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @Async
    public void notifyBothParties(RentalModel rental, String statusLabel) {
        UserModel owner = userRepository.findById(rental.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Dono não encontrado"));
        UserModel renter = userRepository.findById(rental.getRenterId())
                .orElseThrow(() -> new RuntimeException("Locatário não encontrado"));

        sendEmail(owner, rental, statusLabel);
        sendEmail(renter, rental, statusLabel);
    }

    private void sendEmail(UserModel user, RentalModel rental, String statusLabel) {
        Context context = new Context();
        context.setVariable("userName", user.getNomeCompleto());
        context.setVariable("rentalId", rental.getId());
        context.setVariable("status", statusLabel);
        context.setVariable("link", "http://usedevolva.sa-east-1.elasticbeanstalk.com/rentals/" + rental.getId());

        emailService.enviarEmail(user.getEmail(), "Atualização no aluguel #" + rental.getId(), "emails/rental-update", context);
    }
}