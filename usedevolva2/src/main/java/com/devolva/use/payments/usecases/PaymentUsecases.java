package com.devolva.use.payments.usecases;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.dtos.AbacateWebhookDto;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpStatusCodeException;
import java.util.List;

@Service
public class PaymentUsecases {

    @Value("${ABACATE_API_KEY}")
    private String abacateApiKey;

    @Value("${ABACATE_API_URL}")
    private String abacateApiUrl;

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public PaymentUsecases(
            PaymentRepository paymentRepository,
            UserRepository userRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
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



}