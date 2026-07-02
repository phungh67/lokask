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
