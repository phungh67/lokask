package helper

import (
	"strings"
)

func BuildMediaURL(key string) (string, error) {
	if key == "" {
		return "", nil
	}

	if strings.HasPrefix(key, "http") {
		return key, nil
	}

	return "/media/" + key, nil
}

func ExtractMediaKey(frontendURL string) string {
	if frontendURL == "" {
		return ""
	}

	if strings.HasPrefix(frontendURL, "http") {
		return frontendURL
	}

	return strings.TrimPrefix(frontendURL, "/api/v1/media/")
}
