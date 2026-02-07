package config

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		// fallback to local environment
		addr = "localhost:6379"
	}

	// TODO: implement a kind of config map to avoid static config
	RedisClient = redis.NewClient(&redis.Options{
		Addr: addr,
		DB:   0,
	})

	if err := RedisClient.Ping(context.Background()).Err(); err != nil {
		log.Printf("[REDIS] Error in connection, check error: %v", err)
	}
}
