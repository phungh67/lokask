package handler

import (
	"asklocal/internal/mailer"
	"asklocal/internal/repository"
	"context"
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChatHandler struct {
	Repo   *repository.ChatRepository
	Mailer *mailer.MailService
}

type ChatRoom struct {
	Clients map[string]*websocket.Conn
	mu      sync.RWMutex
}

type ChatHubStruct struct {
	Rooms map[string]*ChatRoom
	mu    sync.RWMutex
}

var ChatHub = ChatHubStruct{
	Rooms: make(map[string]*ChatRoom),
}

// helper function to get user ID
func getUserID(c *fiber.Ctx) (string, error) {
	userID := c.Locals("user_id")

	if userID == nil {
		return "", fmt.Errorf("user ID not found in context")
	}

	return userID.(string), nil
}

func ChatWebSocket(c *websocket.Conn) {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		log.Println("[ERROR][CHAT] Unauthorized WebSocket connection")
		c.Close()
		return
	}

	conversationID := c.Query("conversation_id")
	if conversationID == "" {
		log.Println("[ERROR][CHAT] Missing conversation_id in WebSocket request")
		c.Close()
		return
	}

	ChatHub.mu.Lock()
	if ChatHub.Rooms[conversationID] == nil {
		ChatHub.Rooms[conversationID] = &ChatRoom{
			Clients: make(map[string]*websocket.Conn),
		}
	}
	room := ChatHub.Rooms[conversationID]
	ChatHub.mu.Unlock()

	room.mu.Lock()
	room.Clients[userID] = c
	room.mu.Unlock()

	log.Printf("[INFO][CHAT] User %s connected to chat stream of conversation %s", userID, conversationID)

	defer func() {
		room.mu.Lock()
		delete(room.Clients, userID)

		if len(room.Clients) == 0 {
			ChatHub.mu.Lock()
			delete(ChatHub.Rooms, conversationID)
			ChatHub.mu.Unlock()
		}
		room.mu.Unlock()

		c.Close()
		log.Printf("[INFO][CHAT] User %s disconnected to chat stream of conversation %s", userID, conversationID)
	}()

	for {
		_, _, err := c.ReadMessage()
		if err != nil {
			break
		}

		//@TODO: can add and broadcast the *User is typing... here
	}
}

func BroadcastChatMessage(conversationID string, messagePayload interface{}) {
	ChatHub.mu.RLock()
	room := ChatHub.Rooms[conversationID]
	ChatHub.mu.RUnlock()

	if room == nil {
		return
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	for clientID, conn := range room.Clients {
		err := conn.WriteJSON(messagePayload)
		if err != nil {
			log.Printf("[ERROR][CHAT] Failed to deliver messages for users %s: %v", clientID, err)
		}
	}
}

// POST method, converstation
func (h *ChatHandler) StartChat(c *fiber.Ctx) error {
	myIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	myID, err := uuid.Parse(myIDStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
	}

	var req struct {
		ConsultantID string `json:"consultant_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	consultantUUID, err := uuid.Parse(req.ConsultantID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Consultant ID"})
	}

	// Assuming 'myID' is the traveler here
	conv, err := h.Repo.GetOrCreateConversation(myID, consultantUUID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start chat"})
	}

	return c.JSON(conv)
}

// POST /conversations/:id/messages (Send Message)
// POST method to send a message with id
func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	myIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized", "detail": err.Error()})
	}

	myID, err := uuid.Parse(myIDStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
	}
	convID, _ := uuid.Parse(c.Params("id"))

	ctx := c.UserContext()

	var isParticipant bool
	err = h.Repo.DB.Get(&isParticipant, `
		SELECT EXISTS (
			SELECT 1 FROM conversations c
			LEFT JOIN consultants cons ON c.consultant_id = cons.id
			WHERE c.id = $1 AND (c.traveler_id = $2 OR cons.user_id = $2)
		)`, convID, myID)

	log.Printf("[INFO] MyID: %s, conversation: %s", myID, convID)

	if err != nil || !isParticipant {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden: Not a participant of this conversation", "detail": err.Error()})
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid content"})
	}

	if err := h.Repo.CreateMessage(ctx, convID, myID, req.Content); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to send message", "detail": err.Error()})
	}

	go func(senderID, conversationID uuid.UUID, message string) {
		bgCtx := context.Background()

		var info struct {
			ReceiverEmail string `db:"receiver_email"`
			ReceiverName  string `db:"receiver_name"`
			SenderName    string `db:"sender_name"`
		}

		query := `
            SELECT 
                receiver.email AS receiver_email,
                receiver.full_name AS receiver_name,
                sender.full_name AS sender_name
            FROM conversations c
            JOIN users sender ON sender.id = $1
            JOIN consultants cons ON c.consultant_id = cons.id
            JOIN users receiver ON (receiver.id = c.traveler_id OR receiver.id = cons.user_id) AND receiver.id != $1
            WHERE c.id = $2
        `

		err := h.Repo.DB.GetContext(bgCtx, &info, query, senderID, conversationID)
		if err == sql.ErrNoRows {
			return // It's a self-chat. No receiver found, so no email needed.
		} else if err != nil {
			log.Printf("[WARN] Could not fetch receiver info for email notification: %v", err)
			return
		}

		if info.ReceiverEmail != "" {
			preview := message
			if len(preview) > 50 {
				preview = preview[:47] + "..."
			}

			h.Mailer.SendMessageNotification(info.ReceiverEmail, info.ReceiverName, info.SenderName, preview)
		}

	}(myID, convID, req.Content)

	// @TODO current not sure about the ID of the message if it fit with
	// previous payload in the DB
	wsPayload := fiber.Map{
		"id":         uuid.New().String(),
		"content":    req.Content,
		"sender_id":  myID.String(),
		"created_at": time.Now().Format(time.RFC3339),
		"type":       "text",
	}

	go BroadcastChatMessage(convID.String(), wsPayload)

	return c.JSON(fiber.Map{
		"status":    "sent",
		"sender_id": myID,
	})
}

// GET /conversations/:id/messages (Get History)
// update for "mark as read" feature
func (h *ChatHandler) GetHistory(c *fiber.Ctx) error {
	myIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	myID, err := uuid.Parse(myIDStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
	}
	convID, _ := uuid.Parse(c.Params("id"))

	_ = h.Repo.MarkAsRead(convID, myID)

	msgs, err := h.Repo.GetMessages(convID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "Failed to fetch messages",
			"detail": err.Error(),
		})
	}

	// Mark which messages are mine
	for i := range msgs {
		msgs[i].IsMe = (msgs[i].SenderID == myID)
	}

	return c.JSON(msgs)
}

// GET /conversations/:id/session
// func (h *ChatHandler) GetSession(c *fiber.Ctx) error {
// 	// Auth check
// 	myIDStr, err := getUserID(c)
// 	if err != nil {
// 		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
// 	}

// 	_, err = uuid.Parse(myIDStr)
// 	if err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
// 	}

// 	// Parse conversation ID safely
// 	convID, err := uuid.Parse(c.Params("id"))
// 	if err != nil {
// 		return c.Status(400).JSON(fiber.Map{"error": "Invalid Conversation ID"})
// 	}

// 	// Fetch the session using our new Repo method
// 	session, err := h.Repo.GetChatSession(c.UserContext(), convID)
// 	if err != nil {
// 		// A 404 tells the React frontend: "There is no package history here at all"
// 		return c.Status(404).JSON(fiber.Map{
// 			"error":  "No active session found",
// 			"detail": err.Error(),
// 		})
// 	}

// 	// Return the session to React!
// 	return c.JSON(session)
// }

// GET /conversations (Inbox)
func (h *ChatHandler) GetInbox(c *fiber.Ctx) error {
	myIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	myID, err := uuid.Parse(myIDStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
	}

	convs, err := h.Repo.GetInbox(myID)
	if err != nil {
		// Return empty list if no chats found
		return c.JSON([]repository.Conversation{})
	}
	return c.JSON(convs)
}

// a hidden cheat code
func (h *ChatHandler) RefilSession(c *fiber.Ctx) error {
	convID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":  "Invalid conversation",
			"detail": err.Error(),
		})
	}

	query := `
		INSERT INTO consultation_sessions (
			conversation_id, package_type, duration_hours, 
			status, paid_at, started_at, expires_at
		) VALUES (
			$1, 'vip_test', 168, 
			'active', NOW(), NOW(), NOW() + INTERVAL '7 days'
		)
	`

	_, err = h.Repo.DB.ExecContext(c.UserContext(), query, convID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to grant VIP ticket",
			"detail": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "VIP Ticket granted successfully! Refresh your chat."})
}
