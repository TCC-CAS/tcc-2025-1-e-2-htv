package com.devolva.use.chats.repository;

import com.devolva.use.chats.domain.ChatMessageModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessageModel, Long> {

    List<ChatMessageModel> findByChatIdOrderByCreatedAtAsc(Long chatId);

    Optional<ChatMessageModel> findTopByChatIdOrderByCreatedAtDesc(Long chatId);

    List<ChatMessageModel> findByRecipientIdAndReadByRecipientFalse(Long recipientId);

    List<ChatMessageModel> findByChatIdAndRecipientIdAndReadByRecipientFalse(
            Long chatId,
            Long recipientId
    );

    long countByRecipientIdAndReadByRecipientFalse(Long recipientId);
}