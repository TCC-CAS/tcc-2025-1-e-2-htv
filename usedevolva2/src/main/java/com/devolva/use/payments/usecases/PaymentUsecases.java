package com.devolva.use.payments.usecases;

import com.devolva.use.payments.domain.PaymentModel;
import com.devolva.use.payments.domain.PaymentStatus;
import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.payments.repository.PaymentRepository;
import com.devolva.use.users.domain.UserModel;
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

    public PaymentUsecases(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
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
}