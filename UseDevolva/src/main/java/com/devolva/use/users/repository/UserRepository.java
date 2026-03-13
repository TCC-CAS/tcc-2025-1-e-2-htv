package com.devolva.use.users.repository;

import com.devolva.use.users.domain.UserModel;

import java.util.List;
import java.util.Optional;

public interface UserRepository { //adicionar jpa repository para conexão com bd depois
    UserModel save(UserModel user);
    List<UserModel> findAll();
    Optional<UserModel> findById(Long id);
    Optional<UserModel> findByEmail(String email);
    void deleteById(Long id);
}