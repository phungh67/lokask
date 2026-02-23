package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
)

const baseURL = "http://localhost:8080/api/v1"

type AuthResponse struct {
	Token  string `json:"token"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

type CreateBookingRequest struct {
	ConsultantID string  `json:"consultant_id"`
	StartTime    string  `json:"start_time"`
	ServiceType  string  `json:"service_type"`
	UserNotes    string  `json:"user_notes"`
	TotalPrice   float64 `json:"total_price"`
}

func TestE2E_ConsultantTravelerFlow(t *testing.T) {
	db, err := sqlx.Connect("postgres", "user=travel_user password=secret_dev_password dbname=travel_db sslmode=disable")
	if err != nil {
		t.Fatalf("DB Connect failed: %v", err)
	}
	defer db.Close()

	consultantEmail := fmt.Sprintf("expert_%d@test.com", time.Now().UnixNano())
	travelerEmail := fmt.Sprintf("traveler_%d@test.com", time.Now().UnixNano())
	var consultantToken, travelerToken, consultantProfileID string

	// 1. Register Consultant
	t.Run("Register Consultant", func(t *testing.T) {
		regBody, _ := json.Marshal(map[string]interface{}{
			"email":     consultantEmail,
			"password":  "Password123!",
			"full_name": "Test Expert",
			"role":      "consultant",
			"city":      "Tokyo",
		})
		resp, _ := http.Post(baseURL+"/auth/register", "application/json", bytes.NewBuffer(regBody))

		if resp.StatusCode != 201 {
			body, _ := io.ReadAll(resp.Body)
			t.Fatalf("Expected 201, got %d. Body: %s", resp.StatusCode, string(body))
		}

		respBody, _ := io.ReadAll(resp.Body)

		var auth AuthResponse

		if err := json.Unmarshal(respBody, &auth); err != nil {
			t.Fatalf("Failed to unmarshal: %v. Body was: %s", err, string(respBody))
		}

		if auth.UserID == "" {
			t.Fatalf("User ID is empty in response! Body: %s", string(respBody))
		}

		json.NewDecoder(resp.Body).Decode(&auth)
		consultantToken = auth.Token

		// Fetch actual Consultant Profile ID
		url := fmt.Sprintf("%s/users/%s/consultant", baseURL, auth.UserID)
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", consultantToken))
		res, _ := http.DefaultClient.Do(req)

		if res.StatusCode == http.StatusUnauthorized {
			body, _ := io.ReadAll(res.Body)
			t.Fatalf("Auth failed: %s. Token was: %s", string(body), consultantToken)
		}

		var profile map[string]interface{}
		json.NewDecoder(res.Body).Decode(&profile)

		if id, ok := profile["id"].(string); ok {
			consultantProfileID = id
		} else {
			t.Fatalf("Consultant profile ID missing from response: %v", profile)
		}
	})

	// 2. Register Traveler
	t.Run("Register Traveler", func(t *testing.T) {
		regBody, _ := json.Marshal(map[string]interface{}{
			"email":     travelerEmail,
			"password":  "Password123!",
			"full_name": "Test Traveler",
			"role":      "traveler",
		})
		resp, err := http.Post(baseURL+"/auth/register", "application/json", bytes.NewBuffer(regBody))
		assert.NoError(t, err)
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != 201 {
			t.Fatalf("Traveler Registration failed! Status: %d | Body: %s", resp.StatusCode, string(respBody))
		}

		loginBody, _ := json.Marshal(map[string]string{
			"email":    travelerEmail,
			"password": "Password123!",
		})
		loginResp, err := http.Post(baseURL+"/auth/login", "application/json", bytes.NewBuffer(loginBody))
		assert.NoError(t, err)
		defer loginResp.Body.Close()

		loginRespBody, _ := io.ReadAll(loginResp.Body)

		var auth AuthResponse
		if err := json.Unmarshal(loginRespBody, &auth); err != nil {
			t.Fatalf("Failed to unmarshal login response: %v. Body: %s", err, string(loginRespBody))
		}

		// 🟢 Capture the Redis session token
		travelerToken = auth.Token

		if travelerToken == "" {
			t.Fatalf("Traveler token is empty after login! Body: %s", string(loginRespBody))
		}
		t.Logf("Traveler logged in. Token: %s...", travelerToken[:10])
	})

	// 3. Create Booking
	t.Run("Create Booking", func(t *testing.T) {
		if travelerToken == "" {
			t.Fatal("Skipping Create Booking: travelerToken is empty")
		}

		bookingReq := CreateBookingRequest{
			ConsultantID: consultantProfileID,
			StartTime:    time.Now().Add(24 * time.Hour).Format(time.RFC3339),
			ServiceType:  "video_call",
			UserNotes:    "E2E Test Booking",
			TotalPrice:   75.0,
		}

		bookingBody, _ := json.Marshal(bookingReq)

		req, _ := http.NewRequest("POST", baseURL+"/bookings", bytes.NewBuffer(bookingBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", travelerToken))

		resp, err := http.DefaultClient.Do(req)
		assert.NoError(t, err)
		defer resp.Body.Close()

		if resp.StatusCode != 201 {
			body, _ := io.ReadAll(resp.Body)
			t.Fatalf("Booking failed with status %d: %s. Token used: %s", resp.StatusCode, string(body), travelerToken)
		}
	})
}
