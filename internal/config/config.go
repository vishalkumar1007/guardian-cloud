package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	PublicBaseURL    string
	PublicWebURL     string
	PlatformDevToken string
	OpenAIKey        string
	OpenAIBaseURL    string
}

func Load() (*Config, error) {
	loadDotEnv(".env")
	loadDotEnv("../.env")

	cfg := &Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		RedisURL:         getEnv("REDIS_URL", "redis://127.0.0.1:6381/0"),
		PublicBaseURL:    getEnv("PUBLIC_BASE_URL", "http://127.0.0.1:8083"),
		PublicWebURL:     getEnv("PUBLIC_WEB_URL", "http://127.0.0.1:5175"),
		PlatformDevToken: getEnv("GUARDIAN_PLATFORM_DEV_TOKEN", "guardian-dev-super-admin"),
		OpenAIKey:        getEnv("OPENAI_API_KEY", ""),
		OpenAIBaseURL:    getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func loadDotEnv(filepath string) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}
