package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func BlockScanners() fiber.Handler {
	suspiciousPaths := []string{
		".env",
		".git",
		".php",
		"wp-admin",
		"wp-login",
		"config.json",
		"docker-compose.yml",
	}

	return func(c *fiber.Ctx) error {
		path := strings.ToLower(c.Path())

		for _, suspicious := range suspiciousPaths {
			if strings.Contains(path, suspicious) {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Access denied.",
				})
			}
		}

		return c.Next()
	}
}
