// using this handle to mask the actual location of
// storage for static assets
package handler

import (
	"asklocal/internal/storage"
)

type StorageHandler struct {
	Storage storage.FileStorage
}

func NewStorageHandler(s storage.FileStorage) *StorageHandler {
	return &StorageHandler{
		Storage: s,
	}
}
