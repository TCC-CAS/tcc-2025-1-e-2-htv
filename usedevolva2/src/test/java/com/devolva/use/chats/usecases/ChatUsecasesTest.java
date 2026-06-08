package com.devolva.use.chats.usecases;

import com.devolva.use.chats.repository.ChatMessageRepository;
import com.devolva.use.chats.repository.ChatRepository;
import com.devolva.use.chats.usecases.ChatUsecases;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatUsecasesTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatUsecases chatUsecases;

    @Test
    void shouldNotAllowOwnerToChatWithOwnTool() {

        ToolModel tool = new ToolModel();
        tool.setId(1L);
        tool.setOwnerId(1L);

        when(toolRepository.findById(1L))
                .thenReturn(Optional.of(tool));

        assertThrows(
                RuntimeException.class,
                () -> chatUsecases.createOrGetToolChat(
                        1L,
                        1L,
                        "teste"
                )
        );
    }
}