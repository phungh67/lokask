package worker

import (
	"asklocal/internal/mailer"
	"context"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
)

func StartUnreadMessageCron(db *sqlx.DB, mailService *mailer.MailService) {
	ticker := time.NewTicker(5 * time.Minute)

	go func() {
		for range ticker.C {

		}
	}()

	log.Println("[INFO][WORKER] Unread message cron job started.")
}

func processUnreadMessages(db *sqlx.DB, mailService *mailer.MailService) {
	ctx := context.Background()

	query := `
		SELECT 
			m.id AS message_id,
			m.content,
			sender.full_name AS sender_name,
			receiver.email AS receiver_email,
			receiver.full_name AS receiver_name
		FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		JOIN users sender ON m.sender_id = sender.id
		JOIN users receiver ON (receiver.id = c.traveler_id OR receiver.id = (SELECT user_id FROM consultants WHERE id = c.consultant_id)) AND receiver.id != m.sender_id
		WHERE m.is_read = FALSE 
		  AND m.email_sent = FALSE 
		  AND m.created_at <= NOW() - INTERVAL '30 minutes'
		LIMIT 50 -- Process in batches
	`

	rows, err := db.QueryxContext(ctx, query)
	if err != nil {
		log.Printf("[ERROR][WORKER] Failed to fetch unread messages: %v", err)
		return
	}
	defer rows.Close()

	var processedIDs []string

	for rows.Next() {
		var data struct {
			MessageID     string `db:"message_id"`
			Content       string `db:"content"`
			SenderName    string `db:"sender_name"`
			ReceiverEmail string `db:"receiver_email"`
			ReceiverName  string `db:"receiver_name"`
		}

		if err := rows.StructScan(&data); err != nil {
			continue
		}

		preview := data.Content
		if len(preview) > 50 {
			preview = preview[:47] + "..."
		}

		mailErr := mailService.SendMessageNotification(data.ReceiverEmail, data.ReceiverName, data.SenderName, preview)
		if mailErr != nil {
			log.Printf("[ERROR][WORKER] Failed to send to %s: %v", data.ReceiverEmail, mailErr)
			continue
		}

		log.Printf("[INFO][WORKER] Condition Gate triggered. Email sent to %s", data.ReceiverEmail)
		processedIDs = append(processedIDs, data.MessageID)
	}

	if len(processedIDs) > 0 {
		updateQuery, args, err := sqlx.In(`UPDATE messages SET email_sent = TRUE WHERE id IN (?)`, processedIDs)
		if err == nil {
			updateQuery = db.Rebind(updateQuery)
			_, err = db.ExecContext(ctx, updateQuery, args...)
			if err != nil {
				log.Printf("[ERROR][WORKER] Failed to update email_sent status: %v", err)
			}
		}
	}
}
