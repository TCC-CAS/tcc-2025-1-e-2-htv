package com.devolva.use.reports;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.reports.dtos.*;
import com.devolva.use.reports.usecases.ReportUsecases;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportUsecases reportUsecases;

    public ReportController(ReportUsecases reportUsecases) {
        this.reportUsecases = reportUsecases;
    }

    @PostMapping("/create")
    public ResponseEntity<ReportModel> create(@RequestBody CreateReportDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportUsecases.createReport(dto));
    }

    @GetMapping("/admin/list")
    public ResponseEntity<List<ReportDetailsDto>> listAll() {
        return ResponseEntity.ok(reportUsecases.listAllReports());
    }

    @PutMapping("/admin/{reportId}/resolve")
    public ResponseEntity<ReportModel> resolve(
            @PathVariable Long reportId,
            @RequestHeader("X-Admin-Id") Long adminId,
            @RequestParam String action
    ) {
        return ResponseEntity.ok(reportUsecases.resolveReport(reportId, adminId, action));
    }
}