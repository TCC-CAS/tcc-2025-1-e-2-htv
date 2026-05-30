package com.devolva.use.tools.toolusecases;

import com.cloudinary.Cloudinary;
import com.devolva.use.addresses.usecases.AddressUsecases;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.domain.RentalStatus;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.dtos.CreateToolDto;
import com.devolva.use.tools.repository.ToolImageRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.tools.usecases.ToolUsecases;
import com.devolva.use.uploads.ImageUploadConfirmationService;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.domain.UserStatus;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ToolUsecasesTest {

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private ToolImageRepository toolImageRepository;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private ImageUploadConfirmationService imageUploadConfirmationService;

    @Mock
    private AddressUsecases addressUsecases;

    @InjectMocks
    private ToolUsecases toolUsecases;

    private UserModel owner;

    @BeforeEach
    void setup() {
        owner = new UserModel();
        owner.setId(1L);
        owner.setStatus(UserStatus.ATIVO);
        owner.setPlano(UserModel.Plano.FREE);
    }

    private CreateToolDto validDto() {
        return new CreateToolDto(
                "Furadeira",
                "Furadeira Bosch",
                "Ferramentas",
                "Novo",
                BigDecimal.valueOf(50),
                3,
                null,
                "São Paulo",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(10),
                "Observação"
        );
    }

    @Test
    void shouldCreateToolSuccessfully() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(toolRepository.countActiveToolsByOwnerId(1L)).thenReturn(0L);
        when(toolRepository.save(any(ToolModel.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ToolModel result = toolUsecases.createTool(1L, validDto());

        assertNotNull(result);
        assertEquals("Furadeira", result.getNome());

        verify(toolRepository).save(any(ToolModel.class));
    }

    @Test
    void shouldThrowWhenOwnerNotFound() {

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> toolUsecases.createTool(1L, validDto())
        );
    }

    @Test
    void shouldThrowWhenOwnerInactive() {

        owner.setStatus(UserStatus.BLOQUEADO);

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        assertThrows(
                IllegalStateException.class,
                () -> toolUsecases.createTool(1L, validDto())
        );
    }

    @Test
    void shouldFindToolById() {

        ToolModel tool = new ToolModel();
        tool.setId(10L);

        when(toolRepository.findById(10L)).thenReturn(Optional.of(tool));

        ToolModel result = toolUsecases.findById(10L);

        assertEquals(10L, result.getId());
    }

    @Test
    void shouldThrowWhenToolNotFound() {

        when(toolRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> toolUsecases.findById(99L)
        );
    }

    @Test
    void shouldListOwnerTools() {

        toolUsecases.listOwnerTools(1L);

        verify(toolRepository).findByOwnerIdAndAtivoTrue(1L);
    }

    @Test
    void shouldThrowWhenPlanLimitReached() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(toolRepository.countActiveToolsByOwnerId(1L)).thenReturn(999L);

        assertThrows(
                IllegalStateException.class,
                () -> toolUsecases.createTool(1L, validDto())
        );
    }

    @Test
    void shouldThrowWhenOwnerSuspended() {

        owner.setStatus(UserStatus.SUSPENSO);

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        assertThrows(
                IllegalStateException.class,
                () -> toolUsecases.createTool(1L, validDto())
        );
    }

    @Test
    void shouldThrowWhenNameIsBlank() {

        CreateToolDto dto = new CreateToolDto(
                " ",
                "desc",
                "cat",
                "novo",
                BigDecimal.TEN,
                1,
                null,
                "SP",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now(),
                LocalDate.now(),
                "obs"
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(toolRepository.countActiveToolsByOwnerId(1L)).thenReturn(0L);

        assertThrows(
                IllegalArgumentException.class,
                () -> toolUsecases.createTool(1L, dto)
        );
    }

    @Test
    void shouldThrowWhenDailyValueInvalid() {

        CreateToolDto dto = new CreateToolDto(
                "ok",
                "desc",
                "cat",
                "novo",
                BigDecimal.ZERO,
                1,
                null,
                "SP",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now(),
                LocalDate.now(),
                "obs"
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(toolRepository.countActiveToolsByOwnerId(1L)).thenReturn(0L);

        assertThrows(
                IllegalArgumentException.class,
                () -> toolUsecases.createTool(1L, dto)
        );
    }

    @Test
    void shouldThrowWhenPhotoCountInvalid() {

        CreateToolDto dto = new CreateToolDto(
                "ok",
                "desc",
                "cat",
                "novo",
                BigDecimal.TEN,
                10,
                null,
                "SP",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now(),
                LocalDate.now(),
                "obs"
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(toolRepository.countActiveToolsByOwnerId(1L)).thenReturn(0L);

        assertThrows(
                IllegalArgumentException.class,
                () -> toolUsecases.createTool(1L, dto)
        );
    }

    @Test
    void shouldReturnTrueWhenHasPendingRentals() {

        RentalModel rental = mock(RentalModel.class);
        when(rental.getStatus()).thenReturn(RentalStatus.IN_USE);

        when(rentalRepository.findByToolId(1L)).thenReturn(List.of(rental));

        assertTrue(toolUsecases.hasPendingRentals(1L));
    }

    @Test
    void shouldThrowWhenDeleteToolHasPendingRentals() {

        ToolModel tool = new ToolModel();
        tool.setId(1L);
        tool.setOwnerId(1L);
        tool.setAtivo(true);

        RentalModel rental = mock(RentalModel.class);
        when(rental.getStatus()).thenReturn(RentalStatus.IN_USE);

        when(toolRepository.findById(1L)).thenReturn(Optional.of(tool));
        when(rentalRepository.findByToolId(1L)).thenReturn(List.of(rental));

        assertThrows(
                IllegalStateException.class,
                () -> toolUsecases.deleteTool(1L, 1L)
        );
    }

    @Test
    void shouldThrowWhenToolDoesNotBelongToOwner() {

        ToolModel tool = new ToolModel();
        tool.setId(1L);
        tool.setOwnerId(999L);
        tool.setAtivo(true);

        when(toolRepository.findById(1L)).thenReturn(Optional.of(tool));

        assertThrows(
                IllegalStateException.class,
                () -> toolUsecases.deleteTool(1L, 1L)
        );
    }
}