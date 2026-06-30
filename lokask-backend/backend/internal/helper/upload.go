package helper

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

var AllowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

func ValidateAndSecureFilename(originalFilename string) (string, error) {
	ext := strings.ToLower(filepath.Ext(originalFilename))

	if !AllowedImageExtensions[ext] {
		return "", fmt.Errorf("unsupported file format: %s. Allowed formats are JPG, PNG, WEBP, and GIF", ext)
	}

	safeFileName := uuid.New().String() + ext

	return safeFileName, nil
}
