package com.devolva.use.users.repository;

import com.devolva.use.users.domain.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByEmail(String email);

    Optional<UserModel> findByResetPasswordToken(String resetPasswordToken);
    boolean existsByEmail(String email);
    List<UserModel> findByPlano(UserModel.Plano plano);

}
