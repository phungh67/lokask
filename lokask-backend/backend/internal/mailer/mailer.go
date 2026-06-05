package mailer

import (
	"fmt"
	"log"
	"net/smtp"
)

type MailService struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

func NewMailService(host, port, username, password, from string) *MailService {
	return &MailService{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		From:     from,
	}
}

// SendMessageNotification sends an HTML email to the receiver
func (m *MailService) SendMessageNotification(toEmail, toName, senderName, messagePreview string) {
	subject := fmt.Sprintf("Subject: New message from %s on Lokask\n", senderName)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	// Keep the HTML template simple and clean for MVP
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; color: #2E2E2E;">
			<h2 style="color: #C56A49;">Lokask</h2>
			<p>Hi <strong>%s</strong>,</p>
			<p>You have a new message from <strong>%s</strong>:</p>
			<blockquote style="border-left: 4px solid #C56A49; padding-left: 12px; margin-left: 0; color: #4A5565; font-style: italic;">
				"%s"
			</blockquote>
			<p style="margin-top: 24px;">
				<a href="https://lokask.com/dashboard" style="background-color: #C56A49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 50px; font-weight: bold;">
					Reply to Message
				</a>
			</p>
			<p style="font-size: 12px; color: #737373; margin-top: 32px;">
				Please do not reply directly to this email. 
			</p>
		</div>
	`, toName, senderName, messagePreview)

	msg := []byte(subject + mime + body)

	// Auth and send
	auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)
	addr := fmt.Sprintf("%s:%s", m.Host, m.Port)

	// log here
	log.Printf("[MAILER] Current information destination address: %s, sender: %s", addr, senderName)
	log.Printf("[MAILER] Preview msg: %s", messagePreview)

	err := smtp.SendMail(addr, auth, m.From, []string{toEmail}, msg)
	if err != nil {
		log.Printf("[ERROR] Failed to send email to %s: %v", toEmail, err)
	} else {
		log.Printf("[INFO] Email notification successfully sent to %s", toEmail)
	}
}
