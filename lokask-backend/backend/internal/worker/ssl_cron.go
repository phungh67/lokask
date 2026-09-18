package worker

import (
	"asklocal/internal/mailer"
	"crypto/tls"
	"fmt"
	"log"
	"time"
)

const WarnDays = 15

func StartSSLCheckCron(mailSvc *mailer.MailService, domain string) {
	ticker := time.NewTicker(24 * time.Hour)

	go func() {
		checkSSL(mailSvc, domain)

		for range ticker.C {
			checkSSL(mailSvc, domain)
		}
	}()

	log.Printf("[INFO][WORKER] SSL Expiry cron job started.")
}

func checkSSL(mailSvc *mailer.MailService, domain string) {
	conn, err := tls.Dial("tcp", fmt.Sprintf("%:443", domain), nil)
	if err != nil {
		log.Printf("[ERROR][WORKER] SSL Connection failed for %s: %v", domain, err)
	}

	defer conn.Close()

	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		log.Printf("[ERROR][WORKER] No certificates found for %s", domain)
	}

	expiryDate := certs[0].NotAfter
	remainingDays := int(time.Until(expiryDate).Hours() / 24)

	if remainingDays <= WarnDays {
		err := mailSvc.SendSSLExpiryAlert("phungh67@gmail.com", domain, remainingDays, expiryDate.Format("2006-01-02"))
		if err != nil {
			log.Printf("[ERROR][WORKER] Failed to send SSL alert: %v", err)
		}
	} else {
		log.Printf("[INFO][WORKER] SSL for %s is healthy. Expired in %d days.", domain, remainingDays)
	}
}
