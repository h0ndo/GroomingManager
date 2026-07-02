package de.groomingmanager.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.llm")
public record LlmProperties(boolean enabled, String baseUrl, String model, boolean visionEnabled) {}
