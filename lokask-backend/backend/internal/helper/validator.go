package helper

import (
	"log"
	"strings"
)

var allowedDomains = map[string]bool{
	"gmail.com":   true,
	"yahoo.com":   true,
	"outlook.com": true,
}

func IsValidEmailDomain(email string) bool {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		log.Printf("[WARN] Malformed email syntax, input was: %s", email)
		return false
	}

	domain := strings.ToLower(parts[1])
	return allowedDomains[domain]
}
