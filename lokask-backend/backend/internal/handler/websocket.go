package handler

import (
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

type WebSocketHub struct {
	Clients map[string]*websocket.Conn
	mu      sync.RWMutex
}

var Hub = WebSocketHub{
	Clients: make(map[string]*websocket.Conn, 0),
}

func WebSocketHandler(c *websocket.Conn) {
	// handler websocket connection

	// take the user ID first
	userID := c.Locals("user_id").(string)

	// critical selection to shared resource
	Hub.mu.Lock()
	Hub.Clients[userID] = c
	Hub.mu.Unlock()

	log.Printf("[INFO] User %s registered successfully.\n", userID)

	// setup the listening
	var (
		mt  int
		msg []byte
		err error
	)
	for {
		if mt, msg, err = c.ReadMessage(); err != nil {
			log.Printf("[INFO] User %s disconnected\n", userID)
		}

		log.Printf("[INFO] Recieving from %s: %s (type %d)\n", userID, msg, mt)

		// TODO: mapping logic to find exact user
	}

	// cleanup
	Hub.mu.Lock()
	delete(Hub.Clients, userID)
	Hub.mu.Unlock()
}
