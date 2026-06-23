[⬅ Return to Main Compendium](../../../../../../../README.md)

As a senior backend officer specializing in Go and complex backend logic, I recognize that the provided component is a presentation layer artifact (React/TypeScript). However, the core business logic—determining the time proximity, formatting the date string, and deciding the required user action (`Join Now` vs. `Reschedule`)—is crucial and must be extracted into a robust, testable, and type-safe backend service layer.

We will refactor this logic into a Go package, establishing clear data models, a dedicated service layer, and defining the API surface it supports.

---

## 💾 Core Logic Abstraction: Call State Management

The primary logic determines the current state of a scheduled call based on the provided time, enabling the frontend to render the correct actionable UI.

### 1. Data Model Definition (Repository Interface)

We establish the core data structure that the system must ingest.

**File:** `pkg/models/call.go`

```go
package models

import (
	"time"
)

// CallType defines the modality of the meeting.
type CallType string

const (
	Video CallType = "video"
	Voice CallType = "voice"
	// Add other types as needed (e.g., ExternalLink)
)

// ScheduledCall represents the source data for the call banner.
// In a real system, this would typically be retrieved from a User/Calendar repository.
type ScheduledCall struct {
	ID          string
	Type        CallType
	ScheduledAt time.Time // The precise time the call is scheduled for.
	Duration    time.Duration // The length of the call (e.g., 30 minutes).
}
```

### 2. Service Layer Definition (Business Logic)

This package encapsulates all the complex time calculations and state decisions, making the logic idempotent and decoupled from the presentation layer.

**File:** `pkg/service/call_state_service.go`

```go
package service

import (
	"fmt"
	"time"

	"your_project/pkg/models"
)

// BannerState encapsulates all calculated presentation data for the UI.
// This is the stable output payload of our service.
type BannerState struct {
	FormattedTime string // Displayable date/time string (e.g., "Today at 2:00 PM").
	IsStartingSoon bool   // If the user needs to join immediately.
	CanReschedule bool   // If the call is far enough in the future.
	ActionMessage string // The text displayed on the primary button ("Join Now" or "Reschedule").
	JoinURL        string // Potential URL for immediate joining.
}

// CallStateService defines the interface for calling the banner state logic.
type CallStateService interface {
	DetermineState(call models.ScheduledCall) (*BannerState, error)
}

// callStateServiceImpl implements the CallStateService using business logic.
type callStateServiceImpl struct{}

// NewCallStateService initializes the service.
func NewCallStateService() CallStateService {
	return &callStateServiceImpl{}
}

// DetermineState calculates the current state of the scheduled call relative to 'now'.
func (s *callStateServiceImpl) DetermineState(call models.ScheduledCall) (*BannerState, error) {
	now := time.Now().In(time.Local)
	scheduledAt := call.ScheduledAt.In(time.Local)
	
	// Calculate time difference (time.Duration is better than float hours)
	timeDifference := scheduledAt.Sub(now)
	
	// --- CORE BUSINESS LOGIC ---
	
	// 1. Check for Immediate Start (0 <= difference < 1 hour)
	isStartingSoon := timeDifference >= 0 && timeDifference < time.Hour
	
	// 2. Determine Actionability
	var actionMessage string
	var canReschedule bool
	var joinURL string // Mocked URL for demonstration

	if isStartingSoon {
		actionMessage = "Join Now"
		canReschedule = false // Too close to reschedule reliably
		joinURL = "https://mock-meeting.com/join/..." // Placeholder for actual join endpoint
	} else if timeDifference > 24*time.Hour {
		// If it's more than 24 hours away, it's a good candidate for rescheduling
		actionMessage = "Reschedule"
		canReschedule = true
		joinURL = ""
	} else {
		// Default state if the time difference is small but not 'starting soon'
		actionMessage = "Reschedule" 
		canReschedule = true
	}
	
	// 3. Format Time String
	formattedTime := s.formatScheduleTime(scheduledAt)

	// 4. Build and return the payload
	return &BannerState{
		FormattedTime: formattedTime,
		IsStartingSoon: isStartingSoon,
		CanReschedule: canReschedule,
		ActionMessage: actionMessage,
		JoinURL: joinURL,
	}, nil
}

// formatScheduleTime handles the complex date formatting logic.
// This utility function centralizes all date formatting rules, ensuring consistency.
func (s *callStateServiceImpl) formatScheduleTime(scheduledAt time.Time) string {
	now := time.Now().In(time.Local)

	// If scheduled for the current minute or in the past (shouldn't happen if the check passes)
	if scheduledAt.Equal(now) || scheduledAt.Before(now) {
		return "Immediately"
	}

	// Today's formatting
	if scheduledAt.Day(), scheduledAt.Month() == now.Day(), now.Month() {
		// Use custom logic to match the "Today at h:mm a" pattern
		return fmt.Sprintf("Today at %s", scheduledAt.Format("3:04 pm"))
	}
	
	// Tomorrow's formatting
	// Note: time.Time comparison can be tricky. We check if the day is exactly +1.
	if scheduledAt.Year() == now.AddDate(0, 0, 1).Year() && 
	   scheduledAt.Month() == now.AddDate(0, 0, 1).Month() &&
	   scheduledAt.Day() == now.AddDate(0, 0, 1).Day() {
		return fmt.Sprintf("Tomorrow at %s", scheduledAt.Format("3:04 pm"))
	}

	// Default full formatting (EEE, MMM d 'at' h:mm a)
	return scheduledAt.Format("Mon, Jan 2 2006 at 3:04 pm")
}
```

### 3. API Surface Definition

We define a simple API endpoint handler that utilizes the service layer, illustrating how the logic is consumed by a backend endpoint.

**File:** `cmd/api/handler.go`

```go
package api

import (
	"encoding/json"
	"net/http"
	"time"

	"your_project/pkg/models"
	"your_project/pkg/service"
)

// APIServerContext holds dependencies (like the service layer).
type APIServerContext struct {
	CallStateService service.CallStateService
}

// NewAPIServerContext creates a new context with the initialized dependencies.
func NewAPIServerContext() *APIServerContext {
	return &APIServerContext{
		CallStateService: service.NewCallStateService(),
	}
}

// HandleCallBannerStateEndpoint simulates the endpoint call /api/v1/call/status
func (ctx *APIServerContext) HandleCallBannerStateEndpoint(w http.ResponseWriter, r *http.Request) {
	// 1. Data Retrieval (Simulated: In a real system, this fetches from a repository)
	// Use a time 10 minutes in the future for testing "Starting Soon"
	testTime := time.Now().Add(10 * time.Minute) 
	
	// Mock call payload
	callData := models.ScheduledCall{
		ID: "call-123",
		Type: models.Video,
		ScheduledAt: testTime,
		Duration: 30 * time.Minute,
	}

	// 2. Execute Business Logic via Service Layer
	state, err := ctx.CallStateService.DetermineState(callData)
	if err != nil {
		http.Error(w, "Failed to determine call state", http.StatusInternalServerError)
		return
	}

	// 3. Respond with Payload (The client/frontend consumes this JSON payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(state)
}

/* 
Example HTTP Request: GET /api/v1/call/status
Example JSON Response Payload:
{
    "FormattedTime": "Today at 3:10 pm",
    "IsStartingSoon": true,
    "CanReschedule": false,
    "ActionMessage": "Join Now",
    "JoinURL": "https://mock-meeting.com/join/..."
}
*/
```

---

### 🚀 Summary and Architecture Review

| Component | Pattern / Role | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **`models.ScheduledCall`** | Data Transfer Object (DTO) | Go Struct | Defines the input payload structure. |
| **`CallStateService`** | Service Layer (Business Logic) | Go Interface/Struct | Encapsulates time calculations and state machine logic. **This is the core logic.** |
| **`DetermineState`** | Core Logic Method | Go Method | Takes the raw data and outputs a predictable, consumable `BannerState` payload. |
| **`APIServerContext`** | Controller/Handler Layer | Go HTTP Handler | Defines the public API surface, handling input/output serialization and dependency injection. |

**Key Improvements:**

1.  **Decoupling:** The UI (frontend) is no longer responsible for complex date comparisons or action logic. It merely consumes a simple JSON payload (`BannerState`).
2.  **Testability:** The entire complex logic (`DetermineState`) is isolated within the `service` package, allowing unit tests to pass specific `time.Time` values (mocking `time.Now()`) and verify the resulting `BannerState` accurately.
3.  **Type Safety:** Using Go structs and explicit type definitions ensures compile-time safety for all data flows.

*this content was created by AI, but the coding and underlying logic are not.*