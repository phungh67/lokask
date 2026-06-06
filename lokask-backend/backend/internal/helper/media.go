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
		cdnBase := os.Getenv("AWS_S3_MEDIA_BUCKET")
		if cdnBase == "" {
			return "", fmt.Errorf("Error, no S3 was set")
		}
		region := os.Getenv("AWS_DEFAULT_REGION")
		if region == "" {
			region = "eu-north-1"
		}
		return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", cdnBase, region, key), nil
	}

	minioBase := os.Getenv("MINIO_PUBLIC_URL")
	if minioBase == "" {
		minioBase = "http://localhost:9000"
	}
	minioBucket := os.Getenv("MININO_MEDIA_BUCKET")
	if minioBucket == "" {
		minioBucket = "lokask-media"
	}
	return fmt.Sprintf("%s/%s/%s", strings.TrimRight(minioBase, "/"), minioBucket, key), nil
}
