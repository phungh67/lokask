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

// send verification email function
func (m *MailService) SendVerificationEmail(toEmail, toName, token string) {
	subject := "Subject: Verify your Lokask account\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	verificationURL := fmt.Sprintf("https://lokask.se/api/v1/new/verify?token=%s", token)

	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-w-lg; margin: 0 auto; color: #2E2E2E;">
			<h2 style="color: #C56A49;">Welcome to Lokask!</h2>
			<p>Hi <strong>%s</strong>,</p>
			<p>Thank you for signing up. Please verify your email address to activate your account and start connecting with local experts.</p>
			
			<p style="margin-top: 32px; margin-bottom: 32px; text-align: center;">
				<a href="%s" style="background-color: #C56A49; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
					Verify My Account
				</a>
			</p>
			
			<p style="font-size: 14px; color: #4A5565;">
				Or copy and paste this link into your browser:<br>
				<a href="%s" style="color: #C56A49; word-break: break-all;">%s</a>
			</p>
			
			<p style="font-size: 12px; color: #737373; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
				This link will expire in 24 hours. If you did not create an account, please ignore this email.
			</p>
		</div>
	`, toName, verificationURL, verificationURL, verificationURL)

	msg := []byte(subject + mime + body)

	log.Printf("[DEBUG] Check username, password and host: %s, %s, %s", m.Username, m.Password, m.Host)
	log.Printf("[DEBUG] Check body: %s", body)

	auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)
	addr := fmt.Sprintf("%s:%s", m.Host, m.Port)

	log.Printf("[MAILER] Sending verification email to: %s", toEmail)

	err := smtp.SendMail(addr, auth, m.From, []string{toEmail}, msg)
	if err != nil {
		log.Printf("[ERROR] Failed to send verification email to %s: %v", toEmail, err)
	} else {
		log.Printf("[INFO] Verification email successfully sent to %s", toEmail)
	}
}
