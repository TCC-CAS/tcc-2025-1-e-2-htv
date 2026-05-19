package com.devolva.use.payments.dtos;

import com.devolva.use.users.domain.UserModel;

public record CreateCheckoutDto(
        Long userId,
        UserModel.Plano plano
) {
}