package storage

import (
	"asklocal/internal/middleware"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type FileStorage interface {
	UploadProfilePicture(file *multipart.FileHeader, userID string) (string, error)
	UploadFile(file *multipart.FileHeader, ownerID string, objectKey string) (string, error)
	UploadBlogCover(file *multipart.FileHeader, blogID string) (string, error)
	DownloadFile(ctx context.Context, key string) (io.ReadCloser, error)
	DeleteFile(ctx context.Context, key string) error
}

type S3Client struct {
	Client *s3.Client
	Region string
}

// Connection
func ConnectToS3Client() (*S3Client, error) {
	defaultRegion := middleware.GetEnv("AWS_DEFAULT_REGION", "us-east-1")

	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(defaultRegion))
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)
	return &S3Client{
		Client: client,
		Region: defaultRegion,
	}, nil
}

func (s *S3Client) UploadProfilePicture(file *multipart.FileHeader, userID string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	objectKey := fmt.Sprintf("avatar/%s_%d%s", userID, time.Now().Unix(), ext)

	bucketName := middleware.GetEnv("AWS_S3_AVATAR_BUCKET", "lokask-user-avatars")
	contentType := file.Header.Get("Content-type")

	_, err = s.Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		Body:        src,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		log.Printf("[S3] Avatar uploaded failed: %v", err)
		return "", err
	}

	return objectKey, nil
}

func (s *S3Client) UploadFile(file *multipart.FileHeader, ownerID string, objectKey string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	bucketName := middleware.GetEnv("AWS_S3_MEDIA_BUCKET", "lokask-media")
	contentType := file.Header.Get("Content-Type")

	_, err = s.Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		Body:        src,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		log.Printf("[S3] File upload failed: %v", err)
		return "", err
	}

	return objectKey, nil
}

func (s *S3Client) UploadBlogCover(file *multipart.FileHeader, blogID string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}

	objectKey := fmt.Sprintf("blog/%s/cover%s", blogID, ext)

	bucketName := middleware.GetEnv("AWS_S3_MEDIA_BUCKET", "lokask-media")
	contentType := file.Header.Get("Content-Type")

	_, err = s.Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		Body:        src,
		ContentType: aws.String(contentType),
	})

	if err != nil {
		log.Printf("[S3] Blog cover upload failed: %v", err)
		return "", err
	}

	return objectKey, nil
}

func (s *S3Client) DeleteFile(ctx context.Context, key string) error {
	bucketName := middleware.GetEnv("AWS_S3_MEDIA_BUCKET", "lokask-media")
	if bucketName == "" {
		return fmt.Errorf("AWS_S3_MEDIA_BUCKET environment variable is not set.")
	}

	_, err := s.Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("Failed to delete file: %v", err)
	}

	return nil
}

func (s *S3Client) DownloadFile(ctx context.Context, objectKey string) (io.ReadCloser, error) {
	bucketName := middleware.GetEnv("AWS_S3_MEDIA_BUCKET", "lokask-media")
	if bucketName == "" {
		return nil, fmt.Errorf("AWS_S3_MEDIA_BUCKET environment variable is not set.")
	}

	input := &s3.GetObjectInput{
		Bucket: &bucketName,
		Key:    &objectKey,
	}

	result, err := s.Client.GetObject(ctx, input)
	if err != nil {
		return nil, err
	}

	return result.Body, nil
}
