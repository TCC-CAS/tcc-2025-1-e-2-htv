package com.devolva.use.chats.repository;

import com.devolva.use.chats.domain.ChatModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<ChatModel, Long> {

    Optional<ChatModel> findByRentalId(Long rentalId);

    Optional<ChatModel> findByToolIdAndOwnerIdAndRenterIdAndRentalIdIsNull(
            Long toolId,
            Long ownerId,
            Long renterId
    );

    List<ChatModel> findByOwnerIdOrRenterIdOrderByUpdatedAtDesc(
            Long ownerId,
            Long renterId
    );
}