package com.devolva.use.reports.usecases;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.reports.domain.ReportStatus;
import com.devolva.use.reports.dtos.*;
import com.devolva.use.reports.repository.ReportRepository;
import com.devolva.use.users.repository.UserRepository;
import com.devolva.use.tools.repository.ToolRepository; // <-- ADICIONADO
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportUsecases {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ToolRepository toolRepository;

    public ReportUsecases(ReportRepository reportRepository, UserRepository userRepository, ToolRepository toolRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.toolRepository = toolRepository;
    }

    public ReportModel createReport(CreateReportDto dto) {
        if (dto.description() == null || dto.description().isBlank()) {
            throw new IllegalArgumentException("A descrição é obrigatória.");
        }

        ReportModel report = new ReportModel();
        report.setReporterId(dto.reporterId());
        report.setReportedUserId(dto.reportedUserId());
        report.setToolId(dto.toolId());
        report.setRentalId(dto.rentalId());
        report.setReason(dto.reason());
        report.setDescription(dto.description());
        report.setStatus(ReportStatus.PENDING);
        report.setCreatedAt(LocalDateTime.now());

        return reportRepository.save(report);
    }

    public List<ReportDetailsDto> listAllReports() {
        return reportRepository.findAll().stream().map(report -> {
            String reporterName = userRepository.findById(report.getReporterId())
                    .map(u -> u.getNomeCompleto()).orElse("Usuário Removido");

            String reportedName = null;
            if (report.getReportedUserId() != null) {
                reportedName = userRepository.findById(report.getReportedUserId())
                        .map(u -> u.getNomeCompleto()).orElse("Usuário Removido");
            }

            String toolName = null;
            if (report.getToolId() != null) {
                toolName = toolRepository.findById(report.getToolId())
                        .map(t -> t.getNome()).orElse("Ferramenta Removida");
            }

            return new ReportDetailsDto(
                    report.getId(),
                    reporterName,
                    reportedName,
                    report.getToolId(),                    toolName,
                    report.getRentalId(),
                    report.getReason(),
                    report.getDescription(),
                    report.getStatus().name(),
                    report.getCreatedAt().toString()
            );
        }).toList();
    }

    public ReportModel resolveReport(Long reportId, Long adminId, String action) {
        ReportModel report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Denúncia não encontrada."));

        if (action.equalsIgnoreCase("RESOLVE")) {
            report.setStatus(ReportStatus.RESOLVED);
        } else {
            report.setStatus(ReportStatus.DISMISSED);
        }

        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedById(adminId);

        return reportRepository.save(report);
    }
}