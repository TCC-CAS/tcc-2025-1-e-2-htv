package com.devolva.use.uploads;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class ImageUploadConfirmationService {

    private static final int MAX_ATTEMPTS = 4;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(8);
    private static final Duration RETRY_DELAY = Duration.ofMillis(700);

    private final HttpClient httpClient;

    public ImageUploadConfirmationService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public void validateModeration(Map uploadResult, String originalFilename) {
        if (uploadResult == null) {
            throw new IllegalStateException("Não foi possível enviar a imagem " + originalFilename + ".");
        }

        Object moderationStatus = uploadResult.get("moderation_status");
        if ("rejected".equalsIgnoreCase(String.valueOf(moderationStatus))) {
            throw new IllegalArgumentException("Conteúdo impróprio detectado no arquivo: " + originalFilename);
        }

        Object moderation = uploadResult.get("moderation");
        if (moderation instanceof List<?> moderationItems) {
            for (Object item : moderationItems) {
                if (item instanceof Map<?, ?> moderationMap) {
                    Object status = moderationMap.get("status");
                    if ("rejected".equalsIgnoreCase(String.valueOf(status))) {
                        throw new IllegalArgumentException("Conteúdo impróprio detectado no arquivo: " + originalFilename);
                    }
                }
            }
        }
    }

    public void confirmAccessibleImage(Cloudinary cloudinary, Map uploadResult, String originalFilename) {
        String secureUrl = stringValue(uploadResult.get("secure_url"));
        String publicId = stringValue(uploadResult.get("public_id"));

        if (secureUrl == null || publicId == null) {
            destroyUploadedImage(cloudinary, publicId);
            throw new IllegalStateException("O upload da imagem " + originalFilename + " não retornou um link válido.");
        }

        if (!isAccessibleImage(secureUrl)) {
            destroyUploadedImage(cloudinary, publicId);
            throw new IllegalStateException("A imagem " + originalFilename + " foi enviada, mas ainda não está acessível pelo link gerado. Tente enviar novamente.");
        }
    }

    public void destroyUploadedImage(Cloudinary cloudinary, String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException ignored) {
            // A falha na limpeza remota não deve esconder a causa real da falha de upload.
        }
    }

    private boolean isAccessibleImage(String url) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (tryReadImage(url)) {
                return true;
            }

            if (attempt < MAX_ATTEMPTS) {
                try {
                    Thread.sleep(RETRY_DELAY.toMillis());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
        }
        return false;
    }

    private boolean tryReadImage(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .header("Range", "bytes=0-2047")
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                return false;
            }

            String contentType = response.headers()
                    .firstValue("Content-Type")
                    .orElse("")
                    .toLowerCase();

            return contentType.startsWith("image/") && response.body() != null && response.body().length > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? null : text;
    }
}
