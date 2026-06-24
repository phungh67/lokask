package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	rediscfg "asklocal/internal/config"
	"asklocal/internal/handler"
	"asklocal/internal/mailer"
	"asklocal/internal/middleware"
	"asklocal/internal/repository"
	"asklocal/internal/storage"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // Postgres Driver
	// jwt
)

func main() {
	// set up database connection, ensure no fall back
	dbHost := getEnv("DB_HOST", "")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "")
	dbPass := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "")

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName,
	)

	// setup Storage
	storageMode := getEnv("DEPLOYMENT_MODE", "dev")
	var storageService storage.FileStorage
	var err error

	if storageMode == "dev" {
		storageService, err = storage.ConnectToMinioClient()
		if err != nil {
			log.Fatal(err.Error())
		}
		log.Print("[INFO] Connect to Minio Successfully...\n")
	} else if storageMode == "prod" {
		storageService, err = storage.ConnectToS3Client()
		if err != nil {
			log.Fatal(err)
		}
		log.Print("[INFO] Connect to S3 successfully...\n")
	}

	// setup redis
	rediscfg.ConnectRedis()

	// mail service
	mailService := mailer.NewMailService(
		getEnv("MAIL_API_KEY", "password"),
		"noreply@lokask.se",
	)

	db, err := sqlx.Connect("postgres", connStr)
	if err != nil {
		log.Fatalf("[CONN] Failed to connect to DB: %v", err)
	}
	defer db.Close()
	fmt.Println("Connected to PostgreSQL")

	// Setup Components
	// proxyHandler := handler.NewProxyHandler() // proxy handler, fix images error in browsers

	// consultant
	consultantRepo := repository.NewConsultantRepository(db)
	consultantHandler := &handler.ConsultantHandler{Repo: consultantRepo, Storage: storageService}

	// user
	userRepo := repository.NewUserRepository(db)
	userHandler := handler.NewUserHandler(userRepo, storageService)

	// blog
	blogRepo := repository.NewBlogRepository(db)
	blogHandler := &handler.BlogHandler{
		Repo:    blogRepo,
		Storage: storageService,
	}

	// message
	chatRepo := repository.NewChatRepository(db)
	chatHandler := &handler.ChatHandler{Repo: chatRepo, Mailer: mailService}

	// booking
	bookRepo := repository.NewBookingRepository(db)
	bookHandler := handler.NewBookingHandler(bookRepo, consultantRepo, db)

	// auth handler
	authHandler := &handler.AuthHandler{
		UserRepo:       userRepo,
		ConsultantRepo: consultantRepo,
		DB:             db,
		Mailer:         mailService,
	}

	// 3. Setup Fiber App
	app := fiber.New(fiber.Config{
		// limit size in avatar or image upload
		BodyLimit: 20 * 1024 * 1024,
	})

	// limiter
	app.Use("/api/.env", limiter.New(limiter.Config{
		Max:        1,
		Expiration: 24 * time.Hour,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"message": "Access denied.",
			})
		},
	}))

	// logger setup
	app.Use(logger.New())

	// register routes
	api := app.Group("/api/v1")

	// test email
	app.Get("/api/v1/test-email", func(c *fiber.Ctx) error {
		toEmail := c.Query("to")
		if toEmail == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing 'to' parameter. Usage: /api/v1/test-email?to=lhpespoir39@email.com",
			})
		}

		err := mailService.SendMessageNotification(toEmail, "Test User", "No Reply", "Hello Worlds")

		if err != nil {
			log.Printf("[ERROR][MAILER] Error %v", err)
		}

		return c.JSON(fiber.Map{
			"status": "success",
		})
	})

	// get
	// app.Get("/api/v1/proxy/image", proxyHandler.ProxyImage)

	// get consultant
	api.Get("/consultants", consultantHandler.List)
	api.Get("/consultants/:id", consultantHandler.GetProfile)

	// get user
	api.Get("/users/:id/consultant", consultantHandler.GetConsultantByUserID)

	// get extra
	api.Get("/niches", consultantHandler.GetNiches)

	// post (auth)
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)

	api.Post("/auth/logout", authHandler.Logout)

	// blog
	api.Get("/blogs", blogHandler.List)
	api.Get("/blogs/:id", blogHandler.Get)

	// filter
	api.Get("/cities", consultantHandler.GetCities)
	api.Get("/languages", consultantHandler.GetLanguages)

	// public get
	api.Get("/public/:id", bookHandler.PublicGetConsultantSchedule)

	// public verification
	api.Get("/new/verify", authHandler.VerifyEmail)

	// public reset password
	//reset password
	api.Post("/auth/lost-password", authHandler.LostPassword)
	api.Post("/auth/reset-password", authHandler.ResetPassword)

	protected := api.Group("/", middleware.Protect())

	// message api group. of course, protected
	protected.Get("/auth/me", authHandler.GetMe)
	protected.Post("/conversations", chatHandler.StartChat)
	protected.Get("/conversations", chatHandler.GetInbox)
	// protected.Get("/conversations/:id/session", chatHandler.GetSession)
	protected.Post("/conversations/:id/messages", chatHandler.SendMessage)
	protected.Get("/conversations/:id/messages", chatHandler.GetHistory)
	protected.Post("/users/avatar", userHandler.UploadAvatar)
	protected.Post("/blogs", blogHandler.Create)
	protected.Post("/bookings", bookHandler.CreateBooking)        // Create a trip
	protected.Get("/bookings/my-trips", bookHandler.GetUserTrips) // View my trips
	protected.Get("/bookings/consultant/:id", bookHandler.GetMySchedule)
	protected.Delete("/bookings/:id", bookHandler.DeleteBooking)
	protected.Patch("/bookings/:id/status", bookHandler.UpdateStatus)
	protected.Get("/bookings/:id/call-status", handler.GetCallRoomStatus)
	protected.Post("/consultant/media", consultantHandler.UploadMedia) // handler upload file
	protected.Delete("/consultant/media", consultantHandler.DeleteGalleryMedia)
	protected.Patch("/updateprofile", consultantHandler.UpdateProfile)

	// use for test @TODO: disabled it on release
	// app.Post("/api/v1/conversations/:id/cheat-code", chatHandler.RefilSession)

	// websocket interceptor
	app.Use("/ws/video", middleware.Protect(), websocket.New(handler.VideoCallHandler))

	// websocket chat
	app.Use("/ws/chat", middleware.Protect(), websocket.New(handler.ChatWebSocket))

	// start server
	port := getEnv("PORT", "8080")
	fmt.Printf("[LOG] Server running on port %s\n", port)
	log.Fatal(app.Listen(":" + port))
}

// Helper to read env with fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// handler proxy for CORs
func proxyImageHandler(c *fiber.Ctx) error {
	url := c.Query("url")
	if url == "" {
		return c.Status(400).SendString("Missing url parameter")
	}

	resp, err := http.Get(url)
	if err != nil {
		return c.Status(500).SendString("Failed to fetch image")
	}
	defer resp.Body.Close()

	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		c.Set("Content-Type", contentType)
	}

	return c.SendStream(resp.Body)
}
