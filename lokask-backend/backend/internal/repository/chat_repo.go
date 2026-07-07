package repository

import (
	"asklocal/internal/domain"
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Conversation struct {
	ID            uuid.UUID  `db:"id" json:"id"`
	TravelerID    uuid.UUID  `db:"traveler_id" json:"traveler_id"`
	ConsultantID  uuid.UUID  `db:"consultant_id" json:"consultant_id"`
	LastMessage   *string    `db:"last_message" json:"last_message"`
	LastMessageAt *time.Time `db:"last_message_at" json:"last_message_at"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`

	// Extra fields for UI (Joined via SQL)
	// name for the one that you are communicated with
	OtherUserName   string  `db:"other_user_name" json:"other_user_name"`
	OtherUserAvatar *string `db:"other_user_avatar" json:"other_user_avatar"`
}

type Message struct {
	ID             uuid.UUID `db:"id" json:"id"`
	ConversationID uuid.UUID `db:"conversation_id" json:"conversation_id"`
	SenderID       uuid.UUID `db:"sender_id" json:"sender_id"`
	Content        string    `db:"content" json:"content"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	IsRead         bool      `db:"is_read" json:"is_read"`
	EmailSent      bool      `db:"email_sent" json:"-"`
	IsMe           bool      `db:"-" json:"is_me"` // Helper for frontend
}

type ChatRepository struct {
	DB *sqlx.DB
}

func NewChatRepository(db *sqlx.DB) *ChatRepository {
	return &ChatRepository{DB: db}
}

// start or get existing Conversation
func (r *ChatRepository) GetOrCreateConversation(travelerID uuid.UUID, consultantID uuid.UUID) (*Conversation, error) {
	// check for existed
	var conv Conversation
	query := `
    	SELECT c.id, u_cons.full_name as other_user_name, u_cons.avatar_url as other_user_avatar
    	FROM conversations c
    	JOIN consultants cons ON c.consultant_id = cons.id
    	JOIN users u_cons ON cons.user_id = u_cons.id
    	WHERE c.traveler_id = $1 AND c.consultant_id = $2
		`
	err := r.DB.Get(&conv, query, travelerID, consultantID)

	if err == nil {
		return &conv, nil // Found it
	}

	// Create new
	query = `INSERT INTO conversations (traveler_id, consultant_id) VALUES ($1, $2) RETURNING id`
	err = r.DB.QueryRowx(query, travelerID, consultantID).Scan(&conv.ID)
	return &conv, err
}

// internal method for session validation
func (r *ChatRepository) sessionValidation(ctx context.Context, conversationID uuid.UUID) (*domain.ConsultantSession, error) {
	var session domain.ConsultantSession

	query := `
		SELECT * FROM consultation_sessions
		WHERE conversation_id = $1 AND status != 'pending_payment'
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := r.DB.GetContext(ctx, &session, query, conversationID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no active package found. Please purchase a package to chat")
		}
		return nil, err
	}

	if session.Status == "expired" {
		return &session, fmt.Errorf("your consultant package has expired, purchase new package to continue.")
	}

	if !session.ExpiresAt.IsZero() && time.Now().After(session.ExpiresAt) {
		_, updateErr := r.DB.ExecContext(ctx, `
			UPDATE consultation_sessions SET status = 'expired' WHERE id = $1
		`, session.ID)

		if updateErr != nil {
			return nil, fmt.Errorf("failed to update expired session: %w", updateErr)
		}

		session.Status = "expired"
		return &session, fmt.Errorf("your consultant package has expired, purchase new package to continue.")
	}

	return &session, nil
}

func (r *ChatRepository) GetChatSession(ctx context.Context, conversationID uuid.UUID) (*domain.ConsultantSession, error) {
	var isSelfChat bool
	checkQuery := `SELECT traveler_id = consultant_id FROM conversations WHERE id = $1`
	_ = r.DB.GetContext(ctx, &isSelfChat, checkQuery, conversationID)

	if isSelfChat {
		return &domain.ConsultantSession{
			Status: "active",
		}, nil
	}

	session, err := r.sessionValidation(ctx, conversationID)

	if session != nil {
		return session, nil
	}

	return nil, err
}

// create message method
func (r *ChatRepository) CreateMessage(ctx context.Context, conversationID uuid.UUID, senderID uuid.UUID, content string) (uuid.UUID, time.Time, error) {
	var msgID uuid.UUID
	var createdAt time.Time

	// get the conversation first
	var conv Conversation
	err := r.DB.GetContext(ctx, &conv, "SELECT * FROM conversations WHERE id = $1", conversationID)
	if err != nil {
		return uuid.Nil, time.Time{}, err
	}

	// log.Printf("[DEBUG] TravelerID: %s, consultantID: %s", conv.TravelerID.String(), conv.ConsultantID.String())

	// isSelfChat := conv.TravelerID == conv.ConsultantID
	// session, err := r.sessionValidation(ctx, conversationID)

	tx, err := r.DB.BeginTxx(ctx, nil)
	if err != nil {
		return uuid.Nil, time.Time{}, err
	}
	defer tx.Rollback()

	// if !isSelfChat && session != nil && session.Status == "awaiting_reply" && senderID == conv.ConsultantID {
	// 	expiresAt := time.Now().Add(time.Duration(session.DurationHours) * time.Hour)

	// 	_, err = tx.ExecContext(ctx, `
	// 		UPDATE consultation_sessions
	// 		SET status = 'active', started_at = NOW(), expires_at = $1
	// 		WHERE id = $2
	// 	`, expiresAt, session.ID)

	// 	if err != nil {
	// 		return err
	// 	}
	// }

	// Insert Message
	insertQuery := `
		INSERT INTO messages (conversation_id, sender_id, content) 
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err = tx.QueryRowContext(ctx, insertQuery, conversationID, senderID, content).Scan(&msgID, &createdAt)
	if err != nil {
		return uuid.Nil, time.Time{}, err
	}

	// Update Conversation "Last Message" (for inbox sorting)
	updateQuery := `
		UPDATE conversations 
		SET last_message = $1, last_message_at = $2 
		WHERE id = $3
	`
	_, err = tx.ExecContext(ctx, updateQuery, content, createdAt, conversationID)
	if err != nil {
		return uuid.Nil, time.Time{}, err
	}

	err = tx.Commit()
	return msgID, createdAt, err
}

// get message of chat
func (r *ChatRepository) GetMessages(conversationID uuid.UUID) ([]Message, error) {
	var msgs []Message
	query := `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`
	err := r.DB.Select(&msgs, query, conversationID)
	return msgs, err
}

// check inbox
func (r *ChatRepository) GetInbox(userID uuid.UUID) ([]Conversation, error) {
	// must check the role of other person to determine
	// traveler to consultant (User linked to Consultant)
	// consultant to traveler

	query := `
        SELECT 
            c.id, 
            c.traveler_id,   
            c.consultant_id,
            c.last_message, 
            c.last_message_at,
            CASE 
                WHEN c.traveler_id = $1 THEN u_cons.full_name 
                ELSE u_trav.full_name 
            END as other_user_name,
            CASE 
                WHEN c.traveler_id = $1 THEN u_cons.avatar_url 
                ELSE u_trav.avatar_url 
            END as other_user_avatar
        FROM conversations c
        JOIN users u_trav ON c.traveler_id = u_trav.id
        JOIN consultants cons ON c.consultant_id = cons.id
        JOIN users u_cons ON cons.user_id = u_cons.id
        WHERE c.traveler_id = $1 OR cons.user_id = $1
        ORDER BY c.last_message_at DESC
    `
	var convs []Conversation
	err := r.DB.Select(&convs, query, userID)
	return convs, err
}

// set message as "read"
func (r *ChatRepository) MarkAsRead(conversationID uuid.UUID, readerID uuid.UUID) error {
	query := `
		UPDATE messages
		SET is_read = TRUE
		WHERE conversation_id = $1
			AND sender_id != $2
			AND is_read = FALSE	
	`

	_, err := r.DB.Exec(query, conversationID, readerID)
	if err != nil {
		log.Printf("[DB] Query error, detail: %v", err)
		return err
	}
	return nil
}
