package handler

import (
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

type VideoRoom struct {
	Clients map[string]*websocket.Conn // map userID to the exisitng web socket connection
	mu      sync.RWMutex               // protect shared resources
}

type VideoHub struct {
	Rooms map[string]*VideoRoom // map the ID to room
	mu    sync.RWMutex
}

// Call Hub
var CallHub = VideoHub{
	Rooms: make(map[string]*VideoRoom),
}

// websocket handler for Video Calls
func VideoCallHandler(c *websocket.Conn) {
	// take current user ID from local (need to check with JWT)
	userID := c.Locals("user_id").(string)

	// check bookingID to generate room ID
	bookingID := c.Query("booking_id")
	if bookingID == "" {
		log.Printf("[ERROR] User %s has no booking ID first", userID)
		c.Close()
		return
	}

	// Create the room
	CallHub.mu.Lock()
	if CallHub.Rooms[bookingID] == nil {
		// null room, hasn't existed yet
		CallHub.Rooms[bookingID] = &VideoRoom{
			Clients: make(map[string]*websocket.Conn),
		}
	}
	room := CallHub.Rooms[bookingID]
	CallHub.mu.Unlock() // finished room creation

	// add user to room
	room.mu.Lock()
	room.Clients[userID] = c
	room.mu.Unlock()

	log.Printf("[INFO] User %s has successfully joined room for booking %s.", userID, bookingID)

	// listening to message, only end if interrupted (end call,...)
	for {
		mt, msg, err := c.ReadMessage()
		if err != nil {
			log.Printf("[INFO] User %s has left the chat.", userID)
			break
		}

		// broadcast to other person in room
		room.mu.Lock()
		for otherUserID, otherConn := range room.Clients {
			if otherUserID != userID {
				otherConn.WriteMessage(mt, msg)
			}
		}
		room.mu.Unlock()
	}

	// cleanup
	room.mu.Lock()
	delete(room.Clients, userID)
	room.mu.Unlock()
}
