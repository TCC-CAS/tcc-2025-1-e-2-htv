package com.devolva.use.addresses.usecases;

import com.devolva.use.addresses.domain.AddressModel;
import com.devolva.use.addresses.dtos.CreateAddressDto;
import com.devolva.use.addresses.repository.AddressRepository;
import com.devolva.use.addresses.usecases.AddressUsecases;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressUsecasesTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AddressUsecases addressUsecases;

    @Test
    void shouldCreateFirstAddressAsMain() {

        when(userRepository.existsById(1L))
                .thenReturn(true);

        when(addressRepository.existsByOwnerIdAndAtivoTrue(1L))
                .thenReturn(false);

        when(addressRepository.save(any(AddressModel.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateAddressDto dto =
                new CreateAddressDto(
                        "Casa",
                        "12345678",
                        "Rua Teste",
                        "10",
                        null,
                        "Centro",
                        "São Paulo",
                        "SP",
                        false
                );

        AddressModel result =
                addressUsecases.create(1L, dto);

        assertTrue(result.isPrincipal());
    }

    @Test
    void shouldThrowWhenUserDoesNotExist() {

        when(userRepository.existsById(1L))
                .thenReturn(false);

        assertThrows(
                IllegalArgumentException.class,
                () -> addressUsecases.listByUser(1L)
        );
    }
}