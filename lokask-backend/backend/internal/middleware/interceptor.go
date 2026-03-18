package middleware

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func WebSocketInterceptor() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {

			// take the JWT token
			tokenString := c.Query("token")
			if tokenString == "" {
				return c.Status(fiber.StatusUnauthorized).SendString("Missing token")
			}

			userID := c.Locals("user_id").(string)

			c.Locals("user_id", userID)

			return c.Next()
		}

		return fiber.ErrUpgradeRequired
	}
}
