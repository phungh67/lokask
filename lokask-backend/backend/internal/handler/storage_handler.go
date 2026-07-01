// using this handle to mask the actual location of
// storage for static assets
package handler

import (
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/minio/minio-go/v7"
)

type FileStorageHandler struct {
	S3Client    *s3.Client
	MinioClient *minio.Client
	Bucket      string
}

func NewFileStorageHandler(s3Client *s3.Client, minioClient *minio.Client, bucket string) *FileStorageHandler {
	return &FileStorageHandler{
		S3Client:    s3Client,
		MinioClient: minioClient,
		Bucket:      bucket,
	}
}
