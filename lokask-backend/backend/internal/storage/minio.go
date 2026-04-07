package storage

import (
	"context"
	"fmt"
	"log"
	"mime/multipart" // <--- Import this
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	Client *minio.Client
	Bucket string
}

// ConnectToMinioClient (Fixed typo Mimo -> Minio)
func ConnectToMinioClient() (*MinioClient, error) {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	// useSSL := os.Getenv("MINIO_USE_SSL") == "false"
	bucketName := "user-avatars" // Use dashes, cleaner for URLs

	// Initialize Minio client
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})

	if err != nil {
		log.Printf("[MINIO] Failed to connect: %v", err)
		return nil, err
	}

	// Create Bucket if not exists (Your existing logic is perfect)
	ctx := context.Background()
	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		return nil, err
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return nil, err
		}

		// Set Public Policy
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"AWS": ["*"]},
					"Action": ["s3:GetObject"],
					"Resource": ["arn:aws:s3:::%s/*"]
				}
			]
		}`, bucketName)

		if err := minioClient.SetBucketPolicy(ctx, bucketName, policy); err != nil {
			return nil, err
		}
		log.Printf("[MINIO] Created bucket %s", bucketName)
	}

	return &MinioClient{
		Client: minioClient,
		Bucket: bucketName,
	}, nil
}

// http uplaod for profile pictures
func (m *MinioClient) UploadProfilePicture(file *multipart.FileHeader, userID string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	objectName := fmt.Sprintf("avatars/%s_%d%s", userID, time.Now().Unix(), ext)
	bucketName := "user-avatars" // remember to change into arguments or mount environment
	contentType := file.Header.Get("Content-Type")

	ctx := context.Background()
	_, err = m.Client.PutObject(ctx, bucketName, objectName, src, file.Size, minio.PutObjectOptions{
		ContentType: contentType,
	})

	if err != nil {
		log.Printf("[MINIO] Upload failed: %v", err)
		return "", err
	}

	// inside the container, it should be like this
	// @TODO dynamic
	publicURL := getEnv("MINIO_PUBLIC_URL", "http://localhost:9001")
	url := fmt.Sprintf("%s/%s/%s", publicURL, m.Bucket, objectName)
	return url, nil
}

// UploadFile uploads any file to a specific bucket and returns the public URL
// generic function
// ADD: this function now tries to match that object under a directory, starts
// with owner's UUID
func (m *MinioClient) UploadFile(file *multipart.FileHeader, ownerID string, bucketName string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// 1. Generate unique filename (image_123456789.jpg)
	ext := filepath.Ext(file.Filename)
	name := strings.TrimSuffix(filepath.Base(file.Filename), ext)
	cleanName := strings.ReplaceAll(name, " ", "_") // Basic sanitization
	objectName := fmt.Sprintf("%s/%s_%d%s", ownerID, cleanName, time.Now().Unix(), ext)

	ctx := context.Background()
	contentType := file.Header.Get("Content-Type")

	// 2. Upload to MinIO
	_, err = m.Client.PutObject(ctx, bucketName, objectName, src, file.Size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}

	// 3. Construct Public URL
	// Default to port 9000 (API) to avoid the "Grey Image" console port issue
	publicURL := getEnv("MINIO_PUBLIC_URL", "http://localhost:9000")
	url := fmt.Sprintf("%s/%s/%s", publicURL, bucketName, objectName)

	return url, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
