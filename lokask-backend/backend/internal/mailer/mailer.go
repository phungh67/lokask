package mailer

import (
	"fmt"
	"log"

	"github.com/resend/resend-go/v3"
)

type MailService struct {
	Client *resend.Client
	From   string
}

func NewMailService(apiKey, from string) *MailService {
	return &MailService{
		Client: resend.NewClient(apiKey),
		From:   from,
	}
}

type MessageNotificationData struct {
	ReceiverName   string
	SenderName     string
	MessagePreview string
}

// SendMessageNotification sends an HTML email to the receiver
func (m *MailService) SendMessageNotification(toEmail, toName, senderName, messagePreview string) {
	params := &resend.SendEmailRequest{
		From:    "Notification <notification@lokask.se>",
		To:      []string{toEmail},
		Subject: "New message on lokask.se",
		Template: &resend.EmailTemplate{
			Id: "new-message",
			Variables: map[string]any{
				"ReceiverName":   toName,
				"SenderName":     senderName,
				"MessagePreview": messagePreview,
			},
		},
	}

	_, err := m.Client.Emails.Send(params)

	if err != nil {
		log.Printf("[ERROR] Failed to send verification email to %s via Resend: %v", toEmail, err)
	} else {
		log.Printf("[INFO] Verification email successfully sent to %s", toEmail)
	}
}

// send verification email function
func (m *MailService) SendVerificationEmail(toEmail, toName, token string) {
	verificationURL := fmt.Sprintf("https://lokask.se/api/v1/new/verify?token=%s", token)

	params := &resend.SendEmailRequest{
		From:    m.From,
		To:      []string{toEmail},
		Subject: "Verify your Lokask account",
		Template: &resend.EmailTemplate{
			Id: "welcome-email",
			Variables: map[string]any{
				"ReceiverName":    toName,
				"VerificationURL": verificationURL,
			},
		},
	}

	log.Printf("[MAILER] Sending verification email via Resend to: %s", toEmail)
	_, err := m.Client.Emails.Send(params)
	if err != nil {
		log.Printf("[ERROR] Failed to send verification email to %s via Resend: %v", toEmail, err)
	} else {
		log.Printf("[INFO] Verification email successfully sent to %s", toEmail)
	}
}
