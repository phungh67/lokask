package middleware

import (
	"asklocal/internal/config"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// reset logic, every time user does something, reset thier expiration time
func Protect() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// get the user token first
		authHeader := c.Get("Authorization")
		if len(authHeader) < 8 {
			return c.Status(401).JSON(fiber.Map{
				"error": "Missing auth token",
			})
		}
		token := authHeader[7:]
		key := "session:" + token

		fmt.Printf("[INFO] MIDDLEWARE: Looking for Key [%s]\n", key)

		// get data from redis
		userID, err := config.RedisClient.Get(c.Context(), "session:"+token).Result()
		if err != nil {
			fmt.Printf("[INFO] MIDDLEWARE ERROR: Key not found or Redis down. Error: %v\n", err)
			return c.Status(401).JSON(fiber.Map{
				"error": "Session expired",
			})
		}

		// reset session
		config.RedisClient.Expire(c.Context(), "session:"+token, 6*time.Hour)

		c.Locals("user_id", userID)
		return c.Next()
	}
}
