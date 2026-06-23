[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architecture, I have analyzed the provided React component. While this component handles the frontend presentation layer (rendering the message bubbles), the core business logic lies in how the diverse data structures (`ChatMessage` with `type: image`, `type: map`, etc.) are stored, retrieved, and validated on the backend.

Below is the documentation of the core logic, API surface, and repository patterns required to support this feature using Go.

---

## 💾 Data Modeling (Go Structs)

We must model the incoming message data in a type-safe manner that reflects the variable nature of the message content. Using Go structs with embedding or explicit fields is necessary.

```go
// Models/chat.go

// MessageType defines the allowed categories for a chat message.
type MessageType string

const (
	TypeText MessageType = "text"
	TypeImage MessageType = "image"
	TypeMap   MessageType = "map"
)

// ChatMessage represents the core data unit stored in the chat history.
type ChatMessage struct {
	ID        string      `json:"id"`
	Sender    string      `json:"sender"` // e.g., "user" or "bot"
	Timestamp time.Time   `json:"timestamp"`
	Type      MessageType `json:"type"`
	Content   string      `json:"content,omitempty"` // General text content (used by all types)
	
	// Specialized Payloads (Use pointers/interfaces if truly variable, 
	// but for simplicity in Go JSON, dedicated fields are often cleaner.)
	ImagePayload *ImagePayload `json:"image_payload,omitempty"`
	MapPayload   *MapPayload   `json:"map_payload,omitempty"`
}

// ImagePayload holds data specifically for image messages.
type ImagePayload struct {
	URL string `json:"url"` // Corresponds to imageUrl
	Caption string `json:"caption"` // Corresponds to content
}

// MapPayload holds structured geographical data.
type MapPayload struct {
	Name         string `json:"name"`
	Address      string `json:"address"`
	ThumbnailURL string `json:"thumbnailUrl"`
	MapsURL      string `json:"mapsUrl"`
}
```

## 🛠 Service & Business Logic Layer

The `ChatService` handles the core business logic: fetching history, validating message payloads, and preparing the data for serialization to the frontend.

### `ChatService` Responsibilities:
1. **History Retrieval:** Calling the repository to fetch a paginated slice of `ChatMessage` objects.
2. **Data Formatting/Validation:** Ensuring that complex payloads (like `MapPayload`) are correctly structured and sanitized before being served.
3. **Time Handling:** Converting database timestamps into the required format (e.g., UTC conversion and formatting for the client).

### Core Logic Example (Go Pseudocode):

```go
// Services/chat_service.go

// GetHistory retrieves a paginated slice of chat messages.
func (s *Service) GetHistory(userID string, lastMessageID string, limit int) ([]models.ChatMessage, error) {
    // 1. Retrieve raw data from the repository
    messages, err := s.repo.FindMessages(userID, lastMessageID, limit)
    if err != nil {
        return nil, err
    }
    
    // 2. Apply necessary business logic or transformations
    formattedMessages := make([]models.ChatMessage, len(messages))
    for i, msg := range messages {
        // Critical logic: Ensure timestamps are correctly set/formatted before sending.
        // If the database stores time as UTC, ensure this is maintained.
        
        // Example validation: If TypeMap is present, ensure MapPayload exists.
        if msg.Type == models.TypeMap && msg.MapPayload == nil {
            // Log error or return an error indicating corrupted data
            return nil, fmt.Errorf("map payload missing for message ID: %s", msg.ID)
        }
        
        formattedMessages[i] = msg
    }

    return formattedMessages, nil
}
```

## 🌐 API Surface Design (REST/JSON)

We will use a standard REST pattern for fetching chat history.

### Endpoint:
`GET /api/v1/chats/{user_id}/history`

### Query Parameters:
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `last_id` | string | The ID of the last message the client has viewed (for pagination). | `msg-abc-123` |
| `limit` | integer | The maximum number of messages to retrieve. | `50` |

### Success Response (JSON):
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-101",
      "sender": "bot",
      "timestamp": "2023-10-27T14:30:00Z",
      "type": "map",
      "content": "The nearest Starbucks.",
      "map_payload": {
        "name": "Starbucks Downtown",
        "address": "123 Main St, City, Country",
        "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
        "mapsUrl": "https://google.com/maps/..."
      }
    },
    {
      "id": "msg-102",
      "sender": "user",
      "timestamp": "2023-10-27T14:35:00Z",
      "type": "text",
      "content": "What's the time?"
      // map_payload/image_payload will be null/omitted
    }
    // ... more messages
  ],
  "pagination": {
    "total_count": 150,
    "cursor": "msg-101" // Cursor for the next page request
  }
}
```

## 🗄️ Repository Pattern (Go)

The repository abstracts database interactions, keeping the service layer clean of SQL/NoSQL details.

### `ChatRepository` Interface:

```go
// Repository defines the contract for data access operations.
type Repository interface {
	// FindMessages retrieves a list of messages for a specific user, 
    // paginated by the last known message ID.
	FindMessages(userID string, lastMessageID string, limit int) ([]models.ChatMessage, error)
	
    // SaveMessage stores a new message into the database.
	SaveMessage(message models.ChatMessage) error
}

// Implementation Detail (Example using PostgreSQL/GORM)
type SQLChatRepository struct {
	DB *gorm.DB
}

func (r *SQLChatRepository) FindMessages(userID string, lastMessageID string, limit int) ([]models.ChatMessage, error) {
	// The actual implementation must handle the complex JSON/HSTORE nature 
    // of storing variable payloads (MapPayload, ImagePayload) alongside core metadata.
    
    // Query logic typically involves:
    // 1. SELECT * FROM messages WHERE user_id = $1 ORDER BY timestamp ASC LIMIT $2 OFFSET $3
    // 2. JSONB_AGG or specialized retrieval for payload fields.
    
	// ... (DB query execution) ...
	return nil, nil
}
```

***

*this content was created by AI, but the coding and underlying logic are not.*