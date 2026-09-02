package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port          string
	DatabaseURL   string
	RedisURL      string
	PublicBaseURL string
	PublicWebURL  string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", ""),
		RedisURL:      getEnv("REDIS_URL", "redis://127.0.0.1:6381/0"),
		PublicBaseURL: getEnv("PUBLIC_BASE_URL", "http://127.0.0.1:8083"),
		PublicWebURL:  getEnv("PUBLIC_WEB_URL", "http://127.0.0.1:5175"),
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
