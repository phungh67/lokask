package storage

import (
	"asklocal/internal/middleware"
	"log"
)

func NewStorageProvider() (FileStorage, error) {
	provider := middleware.GetEnv("STORAGE_PROVIDER", "s3")

	switch {
	case provider == "s3":
		return ConnectToS3Client()
	case provider == "minio":
		return ConnectToMinioClient()
	}

	log.Printf("[WARN][STORAGE] STORAGE_PROVIDER was not set, default to s3...")
	return ConnectToS3Client()
}
