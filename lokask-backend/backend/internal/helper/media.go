package helper

import (
	"fmt"
	"os"
	"strings"
)

// helper file to construct and parse media's object key
// instead of storing full URL in the database

// return mediaURL from key string
func BuildMediaURL(key string) (string, error) {
	if key == "" || strings.HasPrefix(key, "http") {
		return key, nil
	}

	mode := os.Getenv("DEPLOYMENT_MODE")

	if mode == "" {
		mode = "dev"
	}

	if mode == "prod" {
		cdnBase := os.Getenv("S3_BASE_URL")
		if cdnBase == "" {
			return "", fmt.Errorf("Error, no S3 was set")
		}
		return fmt.Sprintf("%s/%s", strings.TrimRight(cdnBase, "/"), key), nil
	}

	minioBase := os.Getenv("MINIO_BASE_URL")
	return fmt.Sprintf("%s/%s", strings.TrimRight(minioBase, "/"), key), nil
}
