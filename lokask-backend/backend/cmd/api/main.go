package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	rediscfg "asklocal/internal/config"
	"asklocal/internal/handler"
	"asklocal/internal/mailer"
	"asklocal/internal/middleware"
	"asklocal/internal/repository"
	"asklocal/internal/storage"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	minioClient, err := storage.ConnectToMinioClient()
	if err != nil {
		log.Fatal(err)
	}

	// setup redis
	rediscfg.ConnectRedis()

	// mail service
	mailService := mailer.NewMailService(
		getEnv("MAIL_SERVER", "smtp.mailtrap.io"),
		getEnv("MAIL_PORT", "25"),
		getEnv("MAIL_USERNAME", "username"),
		getEnv("MAIL_API_KEY", "password"),
		"noreply@lokask.com",
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
	consultantHandler := &handler.ConsultantHandler{Repo: consultantRepo, Storage: minioClient}

	// user
	userRepo := repository.NewUserRepository(db)
	userHandler := handler.NewUserHandler(userRepo, minioClient)

	// blog
	blogRepo := repository.NewBlogRepository(db)
	blogHandler := &handler.BlogHandler{
		Repo:    blogRepo,
		Storage: minioClient,
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
	}

	// 3. Setup Fiber App
	app := fiber.New(fiber.Config{
		// limit size in avatar or image upload
		BodyLimit: 20 * 1024 * 1024,
		// custom error hanlder
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			log.Printf("Server error: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// logger setup
	app.Use(logger.New())

	// cors, currently not working
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",                                            // Allow ALL origins (Flutter Web on any port)
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",  // Allow these headers
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS", // Allow all methods
	}))

	// register routes
	api := app.Group("/api/v1")

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

	// public get
	api.Get("/public/:id", bookHandler.PublicGetConsultantSchedule)

	// upload avatar
	// move to protected

	// a protected api group, must log in
	// protected := api.Group("/", jwtware.New(jwtware.Config{
	// 	SigningKey: jwtware.SigningKey{Key: []byte("super_secret_jwt_key")}, // MUST MATCH auth_handler key
	// 	SuccessHandler: func(c *fiber.Ctx) error {
	// 		userToken := c.Locals("user").(*jwt.Token)
	// 		claims := userToken.Claims.(jwt.MapClaims)

	// 		c.Locals("user_id", claims["user_id"])
	// 		return c.Next()
	// 	},
	// }))

	protected := api.Group("/", middleware.Protect())

	// message api group. of course, protected
	protected.Get("/auth/me", authHandler.GetMe)
	protected.Post("/conversations", chatHandler.StartChat)
	protected.Get("/conversations", chatHandler.GetInbox)
	protected.Get("/conversations/:id/session", chatHandler.GetSession)
	protected.Post("/conversations/:id/messages", chatHandler.SendMessage)
	protected.Get("/conversations/:id/messages", chatHandler.GetHistory)
	protected.Post("/users/avatar", userHandler.UploadAvatar)
	protected.Post("/blogs", blogHandler.Create)
	protected.Post("/bookings", bookHandler.CreateBooking)        // Create a trip
	protected.Get("/bookings/my-trips", bookHandler.GetUserTrips) // View my trips
	protected.Get("/bookings/consultant/:id", bookHandler.GetMySchedule)
	protected.Delete("/bookings/:id", bookHandler.DeleteBooking)
	protected.Patch("/bookings/:id/status", bookHandler.UpdateStatus)
	protected.Post("/consultant/media", consultantHandler.UploadMedia) // handler upload file

	// websocket interceptor
	app.Use("/ws/video", middleware.Protect(), websocket.New(handler.VideoCallHandler))

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
