// using this handle to mask the actual location of
// storage for static assets
package handler

import (
	"asklocal/internal/middleware"
	"asklocal/internal/storage"
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
)

func MediaProxyHandler(c *fiber.Ctx, s storage.FileStorage) error {
	// get object key
	key := c.Params("key")
	if key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Bad request",
		})
	}

	// setup parameter
	bucketName := middleware.GetEnv("AWS_S3_MEDIA_BUCKET", "deun1-general-purpose-bucket")
	input := &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	}

	result, err := s.GetObject(context.TODO(), input)

}
