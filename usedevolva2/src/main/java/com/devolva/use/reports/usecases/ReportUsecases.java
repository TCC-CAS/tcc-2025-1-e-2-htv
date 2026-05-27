package com.devolva.use.reports.usecases;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.reports.domain.ReportStatus;
import com.devolva.use.reports.dtos.*;
import com.devolva.use.reports.repository.ReportRepository;
import com.devolva.use.tools.usecases.ToolUsecases;
import com.devolva.use.users.repository.UserRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.users.usecases.UserUsecases;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportUsecases {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ToolRepository toolRepository;

    private final UserUsecases userUsecases;
    private final ToolUsecases toolUsecases;

    public ReportUsecases(
            ReportRepository reportRepository,
            UserRepository userRepository,
            ToolRepository toolRepository,
            UserUsecases userUsecases,
            ToolUsecases toolUsecases
    ) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.toolRepository = toolRepository;
        this.userUsecases = userUsecases;
        this.toolUsecases = toolUsecases;
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

        report.setReportedMessages(dto.reportedMessages());

        report.setStatus(ReportStatus.PENDING);
        report.setCreatedAt(LocalDateTime.now());

        return reportRepository.save(report);
    }

    public List<ReportDetailsDto> listAllReports() {
        return reportRepository.findAll().stream().map(report -> {
            String reporterName = "Usuário Desconhecido";
            if (report.getReporterId() != null) {
                reporterName = userRepository.findById(report.getReporterId())
                        .map(u -> u.getNomeCompleto()).orElse("Usuário Removido");
            }

            String reportedName = "N/A";
            if (report.getReportedUserId() != null) {
                reportedName = userRepository.findById(report.getReportedUserId())
                        .map(u -> u.getNomeCompleto()).orElse("Usuário Removido");
            }

            String toolName = "N/A";
            if (report.getToolId() != null) {
                toolName = toolRepository.findById(report.getToolId())
                        .map(t -> t.getNome()).orElse("Ferramenta Removida");
            }

            String reasonStr = report.getReason() != null ? report.getReason() : "GERAL";
            String descStr = report.getDescription() != null ? report.getDescription() : "";
            String statusStr = report.getStatus() != null ? report.getStatus().name() : "PENDING";
            String createdAtStr = report.getCreatedAt() != null ? report.getCreatedAt().toString() : java.time.LocalDateTime.now().toString();

            return new ReportDetailsDto(
                    report.getId(),
                    reporterName,
                    reportedName,
                    report.getToolId(),
                    toolName,
                    report.getRentalId(),
                    reasonStr,
                    report.getReportedMessages(),
                    descStr,
                    statusStr,
                    createdAtStr
            );
        }).toList();
    }

    public ReportModel resolveReport(Long reportId, Long adminId, String action) {

        ReportModel report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Denúncia não encontrada."));

        switch (action.toUpperCase()) {

            case "RESOLVE":
                report.setStatus(ReportStatus.RESOLVED);
                break;

            case "DISMISS":
                report.setStatus(ReportStatus.DISMISSED);
                break;

            case "BLOCK_USER":

                if (report.getReportedUserId() == null) {
                    throw new RuntimeException("Usuário denunciado não encontrado.");
                }

                userUsecases.blockUser(report.getReportedUserId());

                report.setStatus(ReportStatus.RESOLVED);
                break;

            case "DISABLE_TOOL":

                if (report.getToolId() == null) {
                    throw new RuntimeException("Ferramenta denunciada não encontrada.");
                }

                toolUsecases.adminDisableTool(
                        report.getToolId(),
                        adminId,
                        "Ferramenta removida pela moderação após denúncia: "
                                + report.getReason()
                );

                report.setStatus(ReportStatus.RESOLVED);
                break;

            default:
                throw new RuntimeException("Ação inválida.");
        }

        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedById(adminId);

        return reportRepository.save(report);
    }
}