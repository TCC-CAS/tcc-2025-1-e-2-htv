package com.devolva.use.chats.domain;

import com.devolva.use.chats.infrastructure.JpaCryptoConverter; // Importe o conversor aqui
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "chat_messages")
public class ChatMessageModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long chatId;
    private Long senderId;
    private Long recipientId;

    @Column(length = 3000)
    @Convert(converter = JpaCryptoConverter.class) 
    private String message;

    private boolean automaticMessage;
    private boolean readByRecipient;
    private LocalDateTime createdAt;

    public ChatMessageModel() {
        this.createdAt = LocalDateTime.now();
        this.readByRecipient = false;
        this.automaticMessage = false;
    }
}