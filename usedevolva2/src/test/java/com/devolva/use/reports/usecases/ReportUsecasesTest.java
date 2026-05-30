package com.devolva.use.reports.usecases;

import com.devolva.use.reports.domain.ReportModel;
import com.devolva.use.reports.domain.ReportStatus;
import com.devolva.use.reports.dtos.CreateReportDto;
import com.devolva.use.reports.repository.ReportRepository;
import com.devolva.use.tools.repository.ToolRepository;
import com.devolva.use.tools.usecases.ToolUsecases;
import com.devolva.use.users.repository.UserRepository;
import com.devolva.use.users.usecases.UserUsecases;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReportUsecasesTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ToolRepository toolRepository;

    @Mock
    private UserUsecases userUsecases;

    @Mock
    private ToolUsecases toolUsecases;

    @InjectMocks
    private ReportUsecases reportUsecases;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldCreateReport() {

        CreateReportDto dto = new CreateReportDto(
                1L,
                2L,
                3L,
                4L,
                "SPAM",
                "Descrição teste",
                "mensagens"
        );

        ReportModel report = new ReportModel();

        when(reportRepository.save(any()))
                .thenReturn(report);

        ReportModel result = reportUsecases.createReport(dto);

        assertNotNull(result);

        verify(reportRepository).save(any());
    }

    @Test
    void shouldThrowWhenDescriptionIsEmpty() {

        CreateReportDto dto = new CreateReportDto(
                1L,
                2L,
                3L,
                4L,
                "SPAM",
                "",
                null
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> reportUsecases.createReport(dto)
        );
    }

    @Test
    void shouldResolveReport() {

        ReportModel report = new ReportModel();
        report.setId(1L);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        when(reportRepository.save(any()))
                .thenReturn(report);

        ReportModel result =
                reportUsecases.resolveReport(1L, 99L, "RESOLVE");

        assertEquals(
                ReportStatus.RESOLVED,
                result.getStatus()
        );
    }

    @Test
    void shouldDismissReport() {

        ReportModel report = new ReportModel();
        report.setId(1L);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        when(reportRepository.save(any()))
                .thenReturn(report);

        ReportModel result =
                reportUsecases.resolveReport(1L, 99L, "DISMISS");

        assertEquals(
                ReportStatus.DISMISSED,
                result.getStatus()
        );
    }

    @Test
    void shouldThrowWhenReportNotFound() {

        when(reportRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                RuntimeException.class,
                () -> reportUsecases.resolveReport(1L, 99L, "RESOLVE")
        );
    }

    @Test
    void shouldThrowWhenActionIsInvalid() {

        ReportModel report = new ReportModel();
        report.setId(1L);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        assertThrows(
                RuntimeException.class,
                () -> reportUsecases.resolveReport(1L, 99L, "INVALID_ACTION")
        );
    }

    @Test
    void shouldThrowWhenBlockUserHasNoReportedUser() {

        ReportModel report = new ReportModel();
        report.setId(1L);
        report.setReportedUserId(null);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        assertThrows(
                RuntimeException.class,
                () -> reportUsecases.resolveReport(1L, 99L, "BLOCK_USER")
        );
    }
    @Test
    void shouldBlockUserSuccessfully() {

        ReportModel report = new ReportModel();
        report.setId(1L);
        report.setReportedUserId(2L);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        when(reportRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReportModel result =
                reportUsecases.resolveReport(1L, 99L, "BLOCK_USER");

        verify(userUsecases).blockUser(2L);
        assertEquals(ReportStatus.RESOLVED, result.getStatus());
    }

    @Test
    void shouldThrowWhenDisableToolHasNoToolId() {

        ReportModel report = new ReportModel();
        report.setId(1L);
        report.setToolId(null);

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        assertThrows(
                RuntimeException.class,
                () -> reportUsecases.resolveReport(1L, 99L, "DISABLE_TOOL")
        );
    }
    @Test
    void shouldDisableToolSuccessfully() {

        ReportModel report = new ReportModel();
        report.setId(1L);
        report.setToolId(10L);
        report.setReason("SPAM");

        when(reportRepository.findById(1L))
                .thenReturn(Optional.of(report));

        when(reportRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReportModel result =
                reportUsecases.resolveReport(1L, 99L, "DISABLE_TOOL");

        verify(toolUsecases).adminDisableTool(
                eq(10L),
                eq(99L),
                contains("SPAM")
        );

        assertEquals(ReportStatus.RESOLVED, result.getStatus());
    }
    @Test
    void shouldMapReportWithNullFields() {

        ReportModel report = new ReportModel();
        report.setId(1L);
        report.setReporterId(null);
        report.setReportedUserId(null);
        report.setToolId(null);
        report.setReason(null);
        report.setDescription(null);
        report.setStatus(null);
        report.setCreatedAt(null);

        when(reportRepository.findAll())
                .thenReturn(List.of(report));

        when(userRepository.findById(any()))
                .thenReturn(Optional.empty());

        when(toolRepository.findById(any()))
                .thenReturn(Optional.empty());

        var result = reportUsecases.listAllReports();

        assertEquals(1, result.size());

        assertEquals("Usuário Desconhecido", result.get(0).reporterName());
        assertEquals("N/A", result.get(0).reportedUserName());
        assertEquals("N/A", result.get(0).toolName());
    }

    @Test
    void shouldCreateReportSuccessfully() {

        CreateReportDto dto = new CreateReportDto(
                1L, 2L, 3L, 4L,
                "SPAM",
                "alguma descrição",
                "mensagens"
        );

        when(reportRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReportModel result = reportUsecases.createReport(dto);

        assertNotNull(result);
        assertEquals(ReportStatus.PENDING, result.getStatus());
        assertEquals(1L, result.getReporterId());
    }


}