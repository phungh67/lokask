package helper

import "strings"

// GenerateAlias takes a full name and returns the first two words
func GenerateAlias(fullName string) string {
	parts := strings.Fields(strings.TrimSpace(fullName))
	if len(parts) <= 2 {
		return fullName
	}
	return parts[0] + " " + parts[1]
}
