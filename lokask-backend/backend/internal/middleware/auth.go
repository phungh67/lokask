package middleware

import (
	"asklocal/internal/config"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

func Protect() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var token string

		// auth header
		authHeader := c.Get("Authorization")
		if len(authHeader) >= 8 {
			token = authHeader[7:]
		}

		// cookies
		if token == "" {
			token = c.Cookies("session_id")
		}

		// local storage
		if token == "" {
			token = c.Query("token")
		}

		if token == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Missing auth token",
			})
		}

		key := "session:" + token
		// fmt.Printf("[INFO] MIDDLEWARE: Looking for Key [%s]\n", key)

		// get data from redis
		userID, err := config.RedisClient.Get(c.Context(), key).Result()
		if err != nil {
			log.Printf("[INFO] MIDDLEWARE ERROR: Key not found. Error: %v\n", err)
			return c.Status(401).JSON(fiber.Map{
				"error": "Session expired",
			})
		}

		// reset session expiry
		config.RedisClient.Expire(c.Context(), key, 6*time.Hour)

		c.Locals("user_id", userID)
		return c.Next()
	}
}
