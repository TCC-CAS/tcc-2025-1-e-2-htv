package com.devolva.use.security.repository;

import com.devolva.use.security.domain.AdminModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<AdminModel, Long> {


}
