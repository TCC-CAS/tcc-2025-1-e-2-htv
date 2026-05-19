package com.devolva.use.payments.usecases;

import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.users.domain.UserModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

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

    private static final String CHECKOUT_ENDPOINT = "/checkouts/create";

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

            return response.getBody();

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