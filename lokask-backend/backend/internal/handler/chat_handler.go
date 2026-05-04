package handler

import (
	"asklocal/internal/repository"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChatHandler struct {
	Repo *repository.ChatRepository
}

// helper function to get user ID
func getUserID(c *fiber.Ctx) (string, error) {
	userID := c.Locals("user_id")

	if userID == nil {
		return "", fmt.Errorf("user ID not found in context")
	}

	return userID.(string), nil
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
func (h *ChatHandler) GetSession(c *fiber.Ctx) error {
	// Auth check
	myIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	_, err = uuid.Parse(myIDStr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid User ID format"})
	}

	// Parse conversation ID safely
	convID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Conversation ID"})
	}

	// Fetch the session using our new Repo method
	session, err := h.Repo.GetChatSession(c.UserContext(), convID)
	if err != nil {
		// A 404 tells the React frontend: "There is no package history here at all"
		return c.Status(404).JSON(fiber.Map{
			"error":  "No active session found",
			"detail": err.Error(),
		})
	}

	// Return the session to React!
	return c.JSON(session)
}

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
