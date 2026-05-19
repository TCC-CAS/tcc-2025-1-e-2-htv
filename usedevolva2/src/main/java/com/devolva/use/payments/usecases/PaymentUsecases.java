package com.devolva.use.payments.usecases;


import org.springframework.stereotype.Service;



import com.devolva.use.payments.dtos.CreateCheckoutDto;
import com.devolva.use.users.domain.UserModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentUsecases {

    @Value("${ABACATE_API_KEY}")
    private String abacateApiKey;

    @Value("${abacate.api.url}")
    private String abacateApiUrl;

    public Map<String, Object> createCheckout(CreateCheckoutDto dto) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();

        headers.set("Authorization", "Bearer " + abacateApiKey);

        headers.setContentType(MediaType.APPLICATION_JSON);

        Integer amount = getPlanValue(dto.plano());

        Map<String, Object> body = new HashMap<>();

        body.put("amount", amount);

        body.put("description", "Plano " + dto.plano());

        body.put("externalId", dto.userId().toString());

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        abacateApiUrl + "/pixQrCode/create",
                        entity,
                        Map.class
                );

        return response.getBody();
    }

    private Integer getPlanValue(UserModel.Plano plano) {

        switch (plano) {

            case PRATA:
                return 1490;

            case OURO:
                return 2990;

            default:
                return 0;
        }
    }
}