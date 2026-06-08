package com.devolva.use.chats.usecases;

import com.devolva.use.chats.domain.ChatMessageModel;
import com.devolva.use.chats.domain.ChatModel;
import com.devolva.use.chats.dtos.ChatDetailsDto;
import com.devolva.use.chats.dtos.ChatMessageDto;
import com.devolva.use.chats.dtos.ChatSummaryDto;
import com.devolva.use.chats.dtos.SendChatMessageDto;
import com.devolva.use.chats.repository.ChatMessageRepository;
import com.devolva.use.chats.repository.ChatRepository;
import com.devolva.use.rentals.domain.RentalModel;
import com.devolva.use.rentals.repository.RentalRepository;
import com.devolva.use.tools.domain.ToolModel;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.domain.UserModel;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatUsecases {

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ToolRepository toolRepository;
    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;

    public ChatUsecases(
            ChatRepository chatRepository,
            ChatMessageRepository chatMessageRepository,
            ToolRepository toolRepository,
            RentalRepository rentalRepository,
            UserRepository userRepository
    ) {
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.toolRepository = toolRepository;
        this.rentalRepository = rentalRepository;
        this.userRepository = userRepository;
    }

    public ChatModel createOrGetToolChat(Long toolId, Long userId, String initialMessage) {
        ToolModel tool = findTool(toolId);

        if (tool.getOwnerId().equals(userId)) {
            throw new RuntimeException("Você não pode iniciar chat com sua própria ferramenta.");
        }

        ChatModel chat = chatRepository
                .findByToolIdAndOwnerIdAndRenterIdAndRentalIdIsNull(
                        tool.getId(),
                        tool.getOwnerId(),
                        userId
                )
                .orElseGet(() -> {
                    ChatModel newChat = new ChatModel();
                    newChat.setToolId(tool.getId());
                    newChat.setOwnerId(tool.getOwnerId());
                    newChat.setRenterId(userId);
                    return chatRepository.save(newChat);
                });

        if (initialMessage != null && !initialMessage.isBlank()) {
            sendMessage(chat.getId(), new SendChatMessageDto(userId, initialMessage));
        }

        return chat;
    }

    public ChatModel createOrGetRentalChat(Long rentalId) {
        RentalModel rental = findRental(rentalId);

        ChatModel chat = chatRepository
                .findByRentalId(rental.getId())
                .orElseGet(() -> {
                    ChatModel newChat = new ChatModel();
                    newChat.setRentalId(rental.getId());
                    newChat.setToolId(rental.getToolId());
                    newChat.setOwnerId(rental.getOwnerId());
                    newChat.setRenterId(rental.getRenterId());
                    ChatModel savedChat = chatRepository.save(newChat);

                    createAutomaticRentalMessage(savedChat, rental);

                    return savedChat;
                });

        return chat;
    }

    public List<ChatSummaryDto> listUserChats(Long userId) {
        List<ChatModel> chats = chatRepository.findByOwnerIdOrRenterIdOrderByUpdatedAtDesc(userId, userId);

        return chats.stream()
                .map(chat -> toSummary(chat, userId))
                .toList();
    }

    public ChatDetailsDto getChatDetails(Long chatId, Long userId) {
        ChatModel chat = findChat(chatId);
        validateParticipant(chat, userId);

        markMessagesAsRead(chatId, userId);

        List<ChatMessageDto> messages = chatMessageRepository
                .findByChatIdOrderByCreatedAtAsc(chatId)
                .stream()
                .map(this::toMessageDto)
                .toList();

        UserModel otherUser = findUser(getOtherUserId(chat, userId));
        ToolModel tool = findTool(chat.getToolId());

        return new ChatDetailsDto(
                chat.getId(),
                chat.getToolId(),
                chat.getRentalId(),
                chat.getOwnerId(),
                chat.getRenterId(),
                otherUser.getNomeCompleto(),
                otherUser.getProfileImageUrl(),
                tool.getNome(),
                messages
        );
    }

    public ChatMessageDto sendMessage(Long chatId, SendChatMessageDto dto) {
        ChatModel chat = findChat(chatId);
        validateParticipant(chat, dto.senderId());

        Long recipientId = getOtherUserId(chat, dto.senderId());

        ChatMessageModel message = new ChatMessageModel();
        message.setChatId(chat.getId());
        message.setSenderId(dto.senderId());
        message.setRecipientId(recipientId);
        message.setMessage(dto.message());
        message.setAutomaticMessage(false);

        ChatMessageModel savedMessage = chatMessageRepository.save(message);

        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);

        return toMessageDto(savedMessage);
    }

    public long getUnreadCount(Long userId) {
        return chatMessageRepository.countByRecipientIdAndReadByRecipientFalse(userId);
    }

    public void addRentalSystemMessage(Long rentalId, String messageText, Long recipientId) {
        RentalModel rental = findRental(rentalId);

        ChatModel chat = createOrGetRentalChat(rentalId);

        ChatMessageModel message = new ChatMessageModel();
        message.setChatId(chat.getId());
        message.setSenderId(getOtherUserId(chat, recipientId));
        message.setRecipientId(recipientId);
        message.setMessage(messageText);
        message.setAutomaticMessage(true);
        message.setReadByRecipient(false);

        chatMessageRepository.save(message);

        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);
    }

    public String buildStatusMessage(String statusText) {
        String now = LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm")
        );

        return "Sistema: " + statusText + " em " + now + ".";
    }

    private void createAutomaticRentalMessage(ChatModel chat, RentalModel rental) {
        ToolModel tool = findTool(rental.getToolId());
        UserModel owner = findUser(rental.getOwnerId());
        UserModel renter = findUser(rental.getRenterId());

        String messageText =
                "Olá! Chat criado para a locação da ferramenta \"" + tool.getNome() + "\".\n\n" +
                        "Locatário: " + renter.getNomeCompleto() + "\n" +
                        "Proprietário: " + owner.getNomeCompleto() + "\n" +
                        "Período: " + rental.getStartDate() + " até " + rental.getEndDate() + "\n" +
                        "Valor total: R$ " + String.format("%.2f", rental.getTotalValue()) + "\n\n" +
                        "Usem este chat para combinar retirada, devolução e qualquer detalhe da locação.";

        ChatMessageModel message = new ChatMessageModel();
        message.setChatId(chat.getId());
        message.setSenderId(rental.getRenterId());
        message.setRecipientId(rental.getOwnerId());
        message.setMessage(messageText);
        message.setAutomaticMessage(true);

        chatMessageRepository.save(message);
    }

    private void markMessagesAsRead(Long chatId, Long userId) {
        List<ChatMessageModel> unreadMessages =
                chatMessageRepository.findByChatIdAndRecipientIdAndReadByRecipientFalse(chatId, userId);

        unreadMessages.forEach(message -> message.setReadByRecipient(true));

        chatMessageRepository.saveAll(unreadMessages);
    }

    private ChatSummaryDto toSummary(ChatModel chat, Long currentUserId) {
        UserModel otherUser = findUser(getOtherUserId(chat, currentUserId));
        ToolModel tool = findTool(chat.getToolId());

        String lastMessage = "Nenhuma mensagem ainda.";
        try {
            lastMessage = chatMessageRepository
                    .findTopByChatIdOrderByCreatedAtDesc(chat.getId())
                    .map(ChatMessageModel::getMessage)
                    .orElse("Nenhuma mensagem ainda.");
        } catch (Exception e) {
            System.out.println("Erro ao buscar última mensagem: " + e.getMessage());
        }

        long unreadCount = 0;
        try {
            unreadCount = chatMessageRepository
                    .findByChatIdAndRecipientIdAndReadByRecipientFalse(chat.getId(), currentUserId)
                    .size();
        } catch (Exception e) {
            System.out.println("Erro ao buscar contagem de não lidas: " + e.getMessage());
        }

        String updatedAtStr = (chat.getUpdatedAt() != null)
                ? chat.getUpdatedAt().toString()
                : java.time.LocalDateTime.now().toString();

        return new ChatSummaryDto(
                chat.getId(),
                chat.getToolId(),
                chat.getRentalId(),
                chat.getOwnerId(),
                chat.getRenterId(),
                otherUser.getNomeCompleto(),
                otherUser.getProfileImageUrl(),
                tool.getNome(),
                lastMessage,
                updatedAtStr,
                unreadCount
        );
    }

    private ChatMessageDto toMessageDto(ChatMessageModel message) {
        return new ChatMessageDto(
                message.getId(),
                message.getChatId(),
                message.getSenderId(),
                message.getRecipientId(),
                message.getMessage(),
                message.isAutomaticMessage(),
                message.isReadByRecipient(),
                message.getCreatedAt().toString()
        );
    }

    private Long getOtherUserId(ChatModel chat, Long currentUserId) {
        if (chat.getOwnerId().equals(currentUserId)) {
            return chat.getRenterId();
        }

        return chat.getOwnerId();
    }

    private void validateParticipant(ChatModel chat, Long userId) {
        if (!chat.getOwnerId().equals(userId) && !chat.getRenterId().equals(userId)) {
            throw new RuntimeException("Você não participa deste chat.");
        }
    }

    private ChatModel findChat(Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat não encontrado."));
    }

    private ToolModel findTool(Long toolId) {
        return toolRepository.findById(toolId)
                .orElseThrow(() -> new RuntimeException("Ferramenta não encontrada."));
    }

    private RentalModel findRental(Long rentalId) {
        return rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Locação não encontrada."));
    }

    private UserModel findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
    }
}