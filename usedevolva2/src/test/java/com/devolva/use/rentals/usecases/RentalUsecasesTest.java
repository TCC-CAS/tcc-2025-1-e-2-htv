package com.devolva.use.rentals.usecases;

import com.devolva.use.chats.usecases.ChatUsecases;
import com.devolva.use.emails.EmailNotificationService;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.dtos.CreateRentalDto;
import com.devolva.use.rentals.dtos.FinalizeRentalDto;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolImageModel;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolImageRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RentalUsecasesTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ToolImageRepository toolImageRepository;

    @Mock
    private ChatUsecases chatUsecases;

    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private RentalUsecases rentalUsecases;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldFinalizeRental() {

        RentalModel rental = new RentalModel();

        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setRenterId(20L);
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        when(rentalRepository.save(any()))
                .thenReturn(rental);

        FinalizeRentalDto dto =
                new FinalizeRentalDto(10L);

        RentalModel result =
                rentalUsecases.finalizeRental(1L, dto);

        assertEquals(
                RentalStatus.FINALIZED,
                result.getStatus()
        );

        verify(rentalRepository).save(any());
    }

    @Test
    void shouldThrowWhenOwnerIsInvalid() {

        RentalModel rental = new RentalModel();

        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        FinalizeRentalDto dto =
                new FinalizeRentalDto(99L);

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.finalizeRental(1L, dto)
        );
    }

    @Test
    void shouldThrowWhenRentalNotReturned() {

        RentalModel rental = new RentalModel();

        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setStatus(RentalStatus.IN_USE);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        FinalizeRentalDto dto =
                new FinalizeRentalDto(10L);

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.finalizeRental(1L, dto)
        );
    }

    @Test
    void shouldFindRentalById() {

        RentalModel rental = new RentalModel();

        rental.setId(1L);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        RentalModel result =
                rentalUsecases.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }
    @Test
    void shouldThrowWhenRentalNotFound() {

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.findById(1L)
        );
    }
    @Test
    void shouldThrowWhenRentalStatusIsNotReturnable() {

        RentalModel rental = new RentalModel();
        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setStatus(RentalStatus.IN_USE);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        FinalizeRentalDto dto = new FinalizeRentalDto(10L);

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.finalizeRental(1L, dto)
        );
    }
    @Test
    void shouldThrowWhenOwnerDoesNotMatch() {

        RentalModel rental = new RentalModel();
        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        FinalizeRentalDto dto = new FinalizeRentalDto(999L);

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.finalizeRental(1L, dto)
        );
    }
    @Test
    void shouldFindRentalByIdSuccessfully() {

        RentalModel rental = new RentalModel();
        rental.setId(1L);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        RentalModel result = rentalUsecases.findById(1L);

        assertEquals(1L, result.getId());
    }

    @Test
    void shouldReturnRentalsByOwner() {

        RentalModel rental = new RentalModel();
        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setToolId(100L);
        rental.setRenterId(200L);
        rental.setStartDate(java.time.LocalDate.now());
        rental.setEndDate(java.time.LocalDate.now().plusDays(2));
        rental.setStatus(RentalStatus.PENDING);
        rental.setTotalValue(100.0);

        ToolModel tool = new ToolModel();
        tool.setId(100L);
        tool.setNome("Furadeira");

        UserModel renter = new UserModel();
        renter.setNomeCompleto("João");

        ToolImageModel img = new ToolImageModel();
        img.setFilePath("img.jpg");
        img.setPrincipal(true);

        when(rentalRepository.findAll())
                .thenReturn(List.of(rental));

        when(toolRepository.findById(100L))
                .thenReturn(Optional.of(tool));

        when(userRepository.findById(200L))
                .thenReturn(Optional.of(renter));

        when(toolImageRepository.findByToolId(100L))
                .thenReturn(List.of(img));

        List<?> result = rentalUsecases.getRentalsByOwner(10L);

        assertEquals(1, result.size());
    }
    @Test
    void shouldTranslateStatusInFinalizeFlow() {

        RentalModel rental = new RentalModel();
        rental.setId(1L);
        rental.setOwnerId(10L);
        rental.setRenterId(20L);
        rental.setStatus(RentalStatus.RETURNED);

        when(rentalRepository.findById(1L))
                .thenReturn(Optional.of(rental));

        when(rentalRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FinalizeRentalDto dto = new FinalizeRentalDto(10L);

        RentalModel result = rentalUsecases.finalizeRental(1L, dto);

        assertEquals(RentalStatus.FINALIZED, result.getStatus());

        verify(emailNotificationService)
                .notifyBothParties(eq(result), anyString());
    }
    @Test
    void shouldThrowWhenUserIsInactive() {

        UserModel user = new UserModel();
        user.setStatus(UserStatus.BLOQUEADO);

        ToolModel tool = new ToolModel();
        tool.setId(100L);
        tool.setOwnerId(10L);
        tool.setAtivo(true);

        CreateRentalDto dto = new CreateRentalDto(
                100L,
                20L,
                java.time.LocalDate.now().plusDays(1),
                java.time.LocalDate.now().plusDays(2)
        );

        when(toolRepository.findById(100L)).thenReturn(Optional.of(tool));
        when(userRepository.findById(20L)).thenReturn(Optional.of(user)); // tenant bloqueado
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        when(rentalRepository.findAll()).thenReturn(List.of());

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.createRentalRequest(dto)
        );
    }

    @Test
    void shouldThrowWhenTenantIsInactive() {

        ToolModel tool = new ToolModel();
        tool.setId(100L);
        tool.setOwnerId(10L);
        tool.setAtivo(true);

        UserModel tenant = new UserModel();
        tenant.setId(20L);
        tenant.setStatus(UserStatus.BLOQUEADO);

        UserModel owner = new UserModel();
        owner.setId(10L);
        owner.setStatus(UserStatus.ATIVO);

        CreateRentalDto dto = new CreateRentalDto(
                100L,
                20L,
                java.time.LocalDate.now().plusDays(1),
                java.time.LocalDate.now().plusDays(2)
        );

        when(toolRepository.findById(100L)).thenReturn(Optional.of(tool));
        when(userRepository.findById(20L)).thenReturn(Optional.of(tenant));
        when(userRepository.findById(10L)).thenReturn(Optional.of(owner));

        when(rentalRepository.findAll()).thenReturn(List.of());

        assertThrows(
                RuntimeException.class,
                () -> rentalUsecases.createRentalRequest(dto)
        );
    }

}