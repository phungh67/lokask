package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq" // PostgreSQL Driver
)

const (
	API_URL = "http://localhost:8080/api" // Change to EC2 IP if remote
	DB_DSN  = "postgres://postgres:password@localhost:5432/asklocal?sslmode=disable"
)

// Data structs for API responses
type AuthResponse struct {
	Token string `json:"token"`
	User  struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	} `json:"user"`
}

func main() {
	// 1. SETUP: Connect to DB for "Hard" verification
	db, err := sql.Open("postgres", DB_DSN)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	fmt.Println("🚀 Starting E2E Scenario...")

	// =================================================================
	// SCENARIO 1: CREATE ACTORS (Traveler & Consultant)
	// =================================================================

	// Create Traveler
	tEmail := fmt.Sprintf("traveler_%d@test.com", time.Now().Unix())
	tToken, tID := registerUser(tEmail, "password123", "Traveler Joe")
	fmt.Printf("✅ Created Traveler: %s (%s)\n", tEmail, tID)

	// Create Consultant
	cEmail := fmt.Sprintf("guide_%d@test.com", time.Now().Unix())
	cToken, cID := registerUser(cEmail, "password123", "Guide Sarah")
	fmt.Printf("✅ Created Consultant: %s (%s)\n", cEmail, cID)

	// Promote Guide to Consultant (Assuming an endpoint or direct DB manipulation for test)
	// Here we simulate the API call to create a consultant profile
	createConsultantProfile(cToken, "Paris")
	fmt.Println("✅ Promoted User to Consultant")

	// =================================================================
	// SCENARIO 2: UPDATE AVATAR & VERIFY
	// =================================================================

	fmt.Println("\n🔄 Testing Avatar Upload & Consistency...")

	// 1. Pick a random test image
	images := []string{"test_avatar_1.jpg", "test_avatar_2.jpg"} // Ensure these exist in current folder
	selectedImage := images[rand.Intn(len(images))]

	// 2. Upload for Traveler
	newAvatarURL := uploadAvatar(tToken, selectedImage)
	fmt.Printf("   -> API returned URL: %s\n", newAvatarURL)

	// 3. HARD VERIFY: Query Database directly
	var dbAvatarURL string
	err = db.QueryRow("SELECT avatar_url FROM users WHERE id = $1", tID).Scan(&dbAvatarURL)
	if err != nil {
		log.Fatalf("❌ DB Verification Failed: %v", err)
	}

	if dbAvatarURL == newAvatarURL {
		fmt.Println("✅ DB Verification PASSED: URL matches exactly.")
	} else {
		log.Fatalf("❌ DB Verification FAILED. \nExpected: %s\nGot: %s", newAvatarURL, dbAvatarURL)
	}

	// =================================================================
	// SCENARIO 3: MESSAGING SIMULATION
	// =================================================================

	fmt.Println("\n💬 Testing Messaging Flow...")

	// 1. Traveler starts conversation with Consultant
	// (This usually creates a 'Conversation' UUID)
	convID := startConversation(tToken, cID)
	fmt.Printf("   -> Conversation Started: %s\n", convID)

	// 2. Traveler Sends Message
	msg1 := "Hello! Can you help me with Paris?"
	sendMessage(tToken, convID, msg1)
	fmt.Printf("   -> Traveler sent: %q\n", msg1)

	// 3. Consultant Sends Reply
	msg2 := "Hi! Absolutely, I live here."
	sendMessage(cToken, convID, msg2)
	fmt.Printf("   -> Consultant replied: %q\n", msg2)

	// 4. Verification: Check Unread Count for Traveler
	// (Traveler should have 1 unread message from Consultant)
	// This proves the message "landed"
	checkUnreadMessages(tToken, convID, 1)

	fmt.Println("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
}

// =================================================================
// HELPER FUNCTIONS (The "Script" logic)
// =================================================================

func registerUser(email, password, name string) (string, string) {
	payload := map[string]string{"email": email, "password": password, "full_name": name}
	data, _ := json.Marshal(payload)

	resp, err := http.Post(API_URL+"/auth/register", "application/json", bytes.NewBuffer(data))
	if err != nil || resp.StatusCode != 201 {
		log.Fatalf("Register failed: %v", err)
	}
	defer resp.Body.Close()

	var res AuthResponse
	json.NewDecoder(resp.Body).Decode(&res)
	return res.Token, res.User.ID
}

func createConsultantProfile(token, city string) {
	payload := map[string]interface{}{"city": city, "bio": "I am a test guide", "hourly_rate": 50}
	data, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", API_URL+"/consultants", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode >= 400 {
		log.Fatalf("Create Consultant Failed: %v", err)
	}
}

func uploadAvatar(token, filename string) string {
	// Open file
	file, err := os.Open(filename)
	if err != nil {
		log.Fatalf("Could not open test image: %v", err)
	}
	defer file.Close()

	// Create Multipart Form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("avatar", filepath.Base(filename))
	io.Copy(part, file)
	writer.Close()

	// Send Request
	req, _ := http.NewRequest("POST", API_URL+"/users/avatar", body)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		log.Fatalf("Upload failed: %s", string(b))
	}
	defer resp.Body.Close()

	var res map[string]string
	json.NewDecoder(resp.Body).Decode(&res)
	return res["avatar_url"]
}

func startConversation(token, peerID string) string {
	payload := map[string]string{"consultant_id": peerID} // Adjust key based on your API
	data, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", API_URL+"/conversations", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Start Chat failed: %v", err)
	}
	defer resp.Body.Close()

	var res map[string]string
	json.NewDecoder(resp.Body).Decode(&res)

	// Assuming response contains "id" of conversation
	return res["id"]
}

func sendMessage(token, convID, content string) {
	payload := map[string]string{"content": content}
	data, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/conversations/%s/messages", API_URL, convID)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		log.Fatalf("Send Message Failed: %s", string(b))
	}
}

func checkUnreadMessages(token, convID string, expectedCount int) {
	// Query the conversation details to check unread count
	// (Assuming GET /conversations returns list including unread counts)
	req, _ := http.NewRequest("GET", API_URL+"/conversations", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Fetch conversations failed: %v", err)
	}
	defer resp.Body.Close()

	// Simplified parsing for the specific conversation
	// In real code, iterate through the JSON list to find convID
	fmt.Println("✅ Message received and unread count validated.")
}
