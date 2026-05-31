package com.devolva.use.emails;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Async
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String mailHost;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                        TemplateEngine templateEngine,
                        @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.templateEngine = templateEngine;
        this.mailHost = mailHost == null ? "" : mailHost.trim();
    }

    public void enviarEmail(String para, String assunto, String template, Context context) {
        if (mailSender == null || mailHost.isBlank()) {
            System.out.println("Envio de e-mail ignorado: SMTP não configurado.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String htmlContent = templateEngine.process(template, context);

            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(htmlContent, true);
            helper.setFrom("usedevolva@gmail.com");

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erro ao enviar e-mail para " + para + ": " + e.getMessage());
        }
    }
}
