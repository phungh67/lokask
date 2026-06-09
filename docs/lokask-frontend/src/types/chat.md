# README: Communication and Conversation Data Models

## 📝 Overview

This document provides comprehensive technical documentation and a usage guide for core data model interfaces related to scheduled communications and chat/conversation logging. These interfaces—`ScheduledCall`, `ChatMessage`, and `ConversationSummary`—define the structure for managing client-facing communication flows, supporting features from booking, real-time chat, and AI-driven analysis.

The data models are designed to be robust, supporting both backend persistence requirements and rich, interactive front-end display logic.

***

## ⚙️ Detail: Data Structure Reference

### 1. `ScheduledCall`

Defines the structure for a scheduled consultation or meeting session. This model is crucial for booking services and managing the lifecycle of an appointment.

| Property | Type | Description | Constraints/Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the call. | Primary Key. |
| `conversationId` | `string` | ID linking the call to a related conversation thread. | Foreign Key. |
| `type` | `"video" \| "voice"` | The modality of the scheduled call. | Defines required infrastructure endpoint. |
| `scheduledAt` | `Date` | The exact time the call is scheduled to take place. | Must handle time zones correctly. |
| `duration` | `number` | Expected length of the call in minutes. | |
| `status` | `"confirmed" \| "pending" \| "cancelled" \| "completed"` | Current lifecycle state of the call. | Drives UI/workflow logic. |
| `notes` | `string?` | Additional contextual notes regarding the meeting. | Optional field for human input. |
| `createdAt` | `Date` | Timestamp when the record was created. | System tracking field. |

### 2. `ChatMessage`

Defines the structure for individual messages within a conversation. This model must handle diverse content types (text, media, structured data like maps).

| Property | Type | Description | Constraints/Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string \| number` | Unique identifier for the message. | Primary Key. |
| `conversation_id` | `string` | ID linking the message to a specific chat thread. | Foreign Key. |
| `sender_id` | `string` | Identifier of the user/entity who sent the message. | |
| `content` | `string` | The main textual body of the message. | Mandatory for most message types. |
| `is_read` | `boolean` | Indicates if the recipient has viewed the message. | Used for read receipts. |
| `created_at` | `string` | Timestamp when the message was sent (ISO 8601 format recommended). | |
| `sender` | `"user" \| "consultant" \| "traveler"` | **(FE Helper)** Role of the sender. | Used for UI context (e.g., avatar display). |
| `timestamp` | `Date?` | **(FE Helper)** Structured date/time for client-side sorting. | Improves time zone handling on the client. |
| `type` | `"text" \| "image" \| "map"` | **(FE Helper)** Categorization of the message content. | Determines how the content is rendered. |
| `imageUrl` | `string?` | URL for embedded images/media files. | Applicable when `type` is "image". |
| `mapData` | Object? | Structured data for geographical locations. | Applicable when `type` is "map". Requires `name`, `address`, `thumbnailUrl`, `mapsUrl`. |

### 3. `ConversationSummary`

A high-level, AI-generated data structure designed to distill key insights from an entire conversation history. This is primarily used for dashboard views and quick reference summaries.

| Property | Type | Description | Purpose |
| :--- | :--- | :--- | :--- |
| `preferences` | `string[]` | Key interests or requirements identified by the AI (e.g., local cuisine, sustainable travel). | Helps match users with relevant services. |
| `placesmentioned` | `string[]` | List of geographical locations discussed during the chat. | Improves search and geo-tagging features. |
| `decisions` | `string[]` | Concrete agreements or choices made between parties. | Reduces ambiguity and confirms commitments. |
| `nextSteps` | `string[]` | Action items or follow-up tasks assigned to either party. | Essential for workflow management and follow-up emails. |

***

## 💡 Notes & Design Considerations

*   **Data Integrity (Chat):** When handling media types (`imageUrl`, `mapData`), robust validation must be implemented on the backend to ensure that the `type` field accurately matches the presence and format of the auxiliary data.
*   **Time Handling:** The use of both `Date` and `string` types for timestamps (`scheduledAt`, `created_at`) necessitates strict adherence to ISO 8601 format and UTC standards across all microservices to prevent time zone ambiguity bugs.
*   **Separation of Concerns (FE vs. BE):** The helper fields in `ChatMessage` (`sender`, `timestamp`, `type`) are noted for front-end consumption. The backend service responsible for persistence should prioritize the core fields (`id`, `conversation_id`, `sender_id`, `content`, `created_at`).
*   **AI Processing Trigger:** The `ConversationSummary` object should be generated asynchronously. The system design must incorporate a messaging queue (e.g., Kafka) that triggers the AI service upon completion or substantial accumulation of `ChatMessage` data.

## ⚠️ Warnings & Open Items (Things Left Unfinished)

1.  **Error Handling & Persistence:** The current models do not account for data validation errors or data deletion cascades. **Action Item:** Define service-level transaction boundaries and implement robust error logging (e.g., failed attempts to generate `ConversationSummary`).
2.  **Relationships/Joins:** While Foreign Keys are implied, the schema lacks explicit relationships between services (e.g., `ScheduledCall` to `User`, `ChatMessage` to `User`). **Action Item:** A dedicated API contract document detailing the owner and mandatory foreign keys for each model is required.
3.  **Concurrency Control:** For highly active chat conversations, concurrent writes could lead to data inconsistencies. **Action Item:** Evaluate implementing optimistic or pessimistic locking mechanisms on the chat log store (e.g., database level `version` field).
4.  **API Versioning:** These models are foundational. **Action Item:** As the system evolves, all public APIs utilizing these models must be versioned (e.g., `/api/v1/chat/messages`) to ensure backward compatibility.

***

## 📊 Generated Figure: Conceptual Data Flow

Below is a conceptual flow diagram illustrating how these components interact within the larger platform architecture.

(Self-Correction: As a text-based model, I cannot generate a visual figure. I will generate a highly descriptive text representation that functions as a diagram.)

### 🔁 Communication Service Data Flow Diagram (Text Representation)

```mermaid
graph LR
    A[User Interaction] --> B(ChatMessage Service);
    B --> C{Database: Chat Messages};
    D[Scheduled Appointment Creation] --> E(Booking Service);
    E --> F{Database: ScheduledCall};

    B -- Write New Message (Triggers) --> G[Message Queue (e.g., Kafka)];
    C --> G;

    G -- Consumed by --> H(AI Analysis Engine);
    H --> I{AI Output: ConversationSummary};

    J[Dashboard/Client Request] --> I;
    K[Chat Widget Display] --> C;
    L[Booking Dashboard View] --> F;
```

**Description:**
1. **Interaction:** User input generates `ChatMessage` records.
2. **Storage:** `ChatMessage` is stored in the Chat Message Database.
3. **Asynchronous Processing:** Writing a message sends a signal to a **Message Queue**.
4. **Analytics:** The **AI Analysis Engine** consumes this signal, reads the message history, and produces a `ConversationSummary`.
5. **Consumption:** Front-end widgets and dashboards consume the relevant model (`ChatMessage` or `ConversationSummary`) from the respective service/database.