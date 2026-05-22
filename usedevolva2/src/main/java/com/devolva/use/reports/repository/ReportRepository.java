package com.devolva.use.reports.repository;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.security.domain.AdminModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<ReportModel, Long> {
}
