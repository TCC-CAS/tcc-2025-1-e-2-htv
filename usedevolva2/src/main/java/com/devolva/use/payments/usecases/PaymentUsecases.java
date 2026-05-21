package com.devolva.use.payments.usecases;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.dtos.CreateToolPaymentDto;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.repository.UserRepository;
import com.devolva.use.chats.usecases.ChatUsecases;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.List;

@Service
public class PaymentUsecases {

    @Value("${ABACATE_API_KEY}")
    private String abacateApiKey;

    @Value("${ABACATE_API_URL}")
    private String abacateApiUrl;

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ToolRepository toolRepository;
    private final RentalRepository rentalRepository;
    private final ChatUsecases chatUsecases;

    public PaymentUsecases(
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            ToolRepository toolRepository,
            RentalRepository rentalRepository,
            ChatUsecases chatUsecases
    ) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.toolRepository = toolRepository;
        this.rentalRepository = rentalRepository;
        this.chatUsecases = chatUsecases;
    }
    private static final String CHECKOUT_ENDPOINT = "/checkouts/create";

    @SuppressWarnings("unchecked")
    public Map<String, Object> createCheckout(CreateCheckoutDto dto) {

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(10000);

        RestTemplate restTemplate = new RestTemplate(factory);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(abacateApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> item = new HashMap<>();
        item.put("id", getProductId(dto.plano()));
        item.put("quantity", 1);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("userId", dto.userId().toString());
        metadata.put("plano", dto.plano().name());

        Map<String, Object> body = new HashMap<>();
        body.put("items", List.of(item));
        body.put("methods", List.of("CARD"));
        body.put("externalId", "user-" + dto.userId() + "-" + System.currentTimeMillis());
        body.put("metadata", metadata);
        String externalId = "user-" + dto.userId() + "-" + System.currentTimeMillis();

        body.put("externalId", externalId);
        body.put("completionUrl", "http://usedevolva.sa-east-1.elasticbeanstalk.com/payment/success");
        body.put("returnUrl", "http://usedevolva.sa-east-1.elasticbeanstalk.com/users/profile");


        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    abacateApiUrl + CHECKOUT_ENDPOINT,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();

            if (responseBody == null || !Boolean.TRUE.equals(responseBody.get("success"))) {
                return responseBody;
            }

            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");

            PaymentModel payment = new PaymentModel();
            payment.setUserId(dto.userId());
            payment.setTransactionId((String) data.get("id"));
            payment.setCheckoutUrl((String) data.get("url"));
            payment.setAmount(BigDecimal.valueOf(((Number) data.get("amount")).doubleValue()));
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPlano(dto.plano());
            payment.setCreatedAt(LocalDateTime.now());

            paymentRepository.save(payment);

            return responseBody;

        } catch (HttpStatusCodeException e) {
            System.out.println("ERRO ABACATEPAY:");
            System.out.println(e.getStatusCode());
            System.out.println(e.getResponseBodyAsString());

            return Map.of(
                    "success", false,
                    "status", e.getStatusCode().value(),
                    "abacateError", e.getResponseBodyAsString()
            );

        } catch (Exception e) {
            e.printStackTrace();

            return Map.of(
                    "success", false,
                    "error", "Erro ao criar checkout",
                    "message", e.getMessage()
            );
        }
    }

    private String getProductId(UserModel.Plano plano) {
        return switch (plano) {
            case PRATA -> "prod_f2tYmuCEYS5kpH0zSE3eCJLB";
            case OURO -> "prod_zKWEx3s0sQBHNKgMkNUUg3wb";
            default -> throw new RuntimeException("Plano inválido para pagamento");
        };
    }
    @SuppressWarnings("unchecked")
    public Map<String, Object> syncPaymentStatus(String transactionId) {

        PaymentModel payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado: " + transactionId));

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(10000);

        RestTemplate restTemplate = new RestTemplate(factory);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(abacateApiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            String url = abacateApiUrl + "/checkouts/get?id=" + transactionId;

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();

            if (responseBody == null || !Boolean.TRUE.equals(responseBody.get("success"))) {
                return Map.of(
                        "success", false,
                        "message", "Não foi possível consultar o pagamento."
                );
            }

            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            String status = (String) data.get("status");

            if ("PAID".equalsIgnoreCase(status)) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);

                UserModel user = userRepository.findById(payment.getUserId())
                        .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

                user.setPlano(payment.getPlano());
                user.setPlanExpiresAt(LocalDate.now().plusMonths(1));
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
            }

            return Map.of(
                    "success", true,
                    "status", status,
                    "paymentId", payment.getId(),
                    "transactionId", payment.getTransactionId(),
                    "plano", payment.getPlano().name()
            );

        } catch (HttpStatusCodeException e) {
            return Map.of(
                    "success", false,
                    "status", e.getStatusCode().value(),
                    "abacateError", e.getResponseBodyAsString()
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", e.getMessage()
            );
        }
    }

    public Map<String, Object> findLastPendingPayment(Long userId) {
        return paymentRepository
                .findTopByUserIdAndStatusOrderByCreatedAtDesc(userId, PaymentStatus.PENDING)
                .map(payment -> Map.<String, Object>of(
                        "success", true,
                        "transactionId", payment.getTransactionId()
                ))
                .orElse(Map.of(
                        "success", false,
                        "message", "Nenhum pagamento pendente encontrado."
                ));
    }
    @SuppressWarnings("unchecked")
    public Map<String, Object> createToolPixPayment(CreateToolPaymentDto dto) {

        ToolModel tool = toolRepository.findById(dto.toolId())
                .orElseThrow(() -> new RuntimeException("Ferramenta não encontrada."));

        if (!tool.isAtivo()) {
            throw new RuntimeException("Ferramenta inativa.");
        }

        if (!tool.isDisponivel()) {
            throw new RuntimeException("Ferramenta indisponível.");
        }

        LocalDate startDate = LocalDate.parse(dto.startDate());
        LocalDate endDate = LocalDate.parse(dto.endDate());

        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("Data final inválida.");
        }

        long totalDaysLong =
                java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;

        int totalDays = (int) totalDaysLong;

        double dailyRate = tool.getValorDiaria().doubleValue();

        double baseValue = dailyRate * totalDays;

        double serviceFee = baseValue * 0.07;

        double totalValue = baseValue + serviceFee;

        double ownerNetValue = baseValue;


        RentalModel rental = new RentalModel();

        rental.setToolId(tool.getId());

        rental.setOwnerId(tool.getOwnerId());

        rental.setRenterId(dto.userId());

        rental.setStartDate(startDate);

        rental.setEndDate(endDate);

        rental.setTotalDays(totalDays);

        rental.setDailyRate(dailyRate);

        rental.setBaseValue(baseValue);

        rental.setServiceFee(serviceFee);

        rental.setTotalValue(totalValue);

        rental.setOwnerNetValue(ownerNetValue);

        rental.setStatus(RentalStatus.PENDING);

        rental.setRequestedAt(LocalDateTime.now());

        rental = rentalRepository.save(rental);


        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(10000);

        factory.setReadTimeout(10000);

        RestTemplate restTemplate = new RestTemplate(factory);

        HttpHeaders headers = new HttpHeaders();

        headers.setBearerAuth(abacateApiKey);

        headers.setContentType(MediaType.APPLICATION_JSON);


        Map<String, Object> metadata = new HashMap<>();

        metadata.put("rentalId", rental.getId());

        metadata.put("toolId", tool.getId());

        metadata.put("ownerId", tool.getOwnerId());

        metadata.put("renterId", dto.userId());

        int amount = (int) Math.round(totalValue * 100);

        Map<String, Object> data = new HashMap<>();

        data.put("amount", amount);

        data.put(
                "description",
                "Aluguel da ferramenta: " + tool.getNome()
        );

        data.put("expiresIn", 3600);

        data.put(
                "externalId",
                "rental-" + rental.getId()
        );

        data.put("metadata", metadata);

        Map<String, Object> body = new HashMap<>();

        body.put("method", "PIX");

        body.put("data", data);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(body, headers);

        try {

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            abacateApiUrl + "/transparents/create",
                            entity,
                            Map.class
                    );

            Map<String, Object> responseBody = response.getBody();

            if (responseBody == null
                    || !Boolean.TRUE.equals(responseBody.get("success"))) {

                rental.setStatus(RentalStatus.CANCELLED);

                rentalRepository.save(rental);

                return responseBody;
            }

            Map<String, Object> transparentData =
                    (Map<String, Object>) responseBody.get("data");

            PaymentModel payment = new PaymentModel();

            payment.setUserId(dto.userId());

            payment.setTransactionId((String) transparentData.get("id"));

            payment.setAmount(BigDecimal.valueOf(totalValue));

            payment.setStatus(PaymentStatus.PENDING);

            payment.setCreatedAt(LocalDateTime.now());
            payment.setCheckoutUrl(null);

            payment = paymentRepository.save(payment);


            rental.setPaymentId(payment.getId());

            rentalRepository.save(rental);


            return Map.of(
                    "success", true,

                    "rentalId", rental.getId(),

                    "paymentId", payment.getId(),

                    "pixQrCode", transparentData.get("brCode"),

                    "pixQrCodeBase64", transparentData.get("brCodeBase64"),

                    "amount", totalValue,

                    "expiresAt", transparentData.get("expiresAt")
            );

        } catch (HttpStatusCodeException e) {

            rental.setStatus(RentalStatus.CANCELLED);

            rentalRepository.save(rental);

            return Map.of(
                    "success", false,
                    "status", e.getStatusCode().value(),
                    "abacateError", e.getResponseBodyAsString()
            );

        } catch (Exception e) {

            rental.setStatus(RentalStatus.CANCELLED);

            rentalRepository.save(rental);

            return Map.of(
                    "success", false,
                    "error", "Erro ao gerar pagamento Pix",
                    "message", e.getMessage()
            );
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> syncToolPaymentStatus(
            Long paymentId
    ) {

        PaymentModel payment = paymentRepository
                .findById(paymentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Pagamento não encontrado."
                        )
                );

        RentalModel rental = rentalRepository
                .findByPaymentId(payment.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Aluguel não encontrado."
                        )
                );


        if (payment.getStatus() != PaymentStatus.PAID) {

            payment.setStatus(
                    PaymentStatus.PAID
            );

            payment.setPaidAt(
                    LocalDateTime.now()
            );

            paymentRepository.save(payment);

            rental.setStatus(
                    RentalStatus.PAID
            );

            rental.setPaidAt(
                    LocalDateTime.now()
            );

            rentalRepository.save(rental);
            chatUsecases.createOrGetRentalChat(rental.getId());
        }

        return Map.of(
                "success", true,
                "status", "PAID",
                "paymentId", payment.getId(),
                "transactionId",
                payment.getTransactionId(),
                "rentalId", rental.getId()
        );
    }

}