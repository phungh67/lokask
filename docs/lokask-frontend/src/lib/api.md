# API Client Library Documentation: Core Services

This document provides a comprehensive overview and usage guide for the client-side API wrapper. This module centralizes all interactions with the backend services, handling authentication, error management, data transformation, and API endpoint construction for the entire platform (Consulting, Booking, Chat, User Management).

***

## 💡 Overview

This file implements a robust TypeScript API client layer responsible for communicating with the backend API (`/api/v1`). It abstracts the complexities of HTTP requests, including authorization (JWT token handling), standardized error parsing, request serialization, and data mapping.

The core domains managed by this client are:

1.  **Authentication & User Profile:** Registration, Login, and retrieving the current user's profile (`getMe`, `register*`, `login`).
2.  **Consultant Directory:** Fetching and filtering consultants (`getConsultants`, `getConsultantById`, `getNiches`).
3.  **Booking & Scheduling:** Managing trip bookings (traveller side) and consulting schedules (consultant side) (`createBooking`, `getMyTrips`, `getConsultantBookings`).
4.  **Communication (Chat):** Handling real-time messaging history and sending messages (`getInbox`, `getChatHistory`, `sendMessage`).
5.  **Media & Profile:** Managing user avatar and professional media uploads (`uploadAvatar`, `uploadConsultantMedia`).

## 📋 Detailed Functionality

### ⚙️ Core Utilities & Error Handling

**`BASE_URL`**: `/api/v1`
**`fetchJson<T>(endpoint: string, ...)`**: The core function handling all API calls. It centralizes error handling and standardized data fetching.

### 👤 User & Profile Management

*   **`getAvatar`**: Handles the upload and retrieval of user profile pictures.
*   **`getChatSession`**: Manages the retrieval of active chat conversations.

### 🔬 Appointment & Booking Logic

*   **`getConsultation`**: Fetches user consultation details.
*   **`getBookingDetails`**: Retrieves specific booking information.
*   **`getChatHistory`**: Fetches the history of chats between two users.

### 💬 Messaging & Chat System

*   **`sendMessage`**: Sends a new message in a chat thread.
*   **`getChatMessages`**: Retrieves the paginated list of messages for a given chat ID.

### 📈 Search & Listing Features

*   **`searchConsultant`**: Searches for consultants based on criteria (e.g., specialty, availability).
*   **`getConsultantProfile`**: Fetches the comprehensive profile of a single consultant.

### 🚀 Advanced Business Logic & Workflow

*   **`bookConsultation`**: Initiates a booking request.
*   **`getBookingAvailability`**: Checks the schedule availability of a consultant.
*   **`updateProfile`**: Allows the user to update their personal details.

---

### **Detailed Feature Breakdown**

#### 1. Chat Messaging (`ChatService`)
| Function | Endpoint/Action | Description |
| :--- | :--- | :--- |
| `sendMessage(chatId, message)` | POST `/chats/{chatId}/messages` | Sends text messages within a specific chat room. |
| `getChatMessages(chatId, page)` | GET `/chats/{chatId}/messages` | Retrieves message history, supporting pagination. |
| `getChatSession(userId)` | GET `/chats/sessions` | Lists all chat sessions the user belongs to. |

#### 2. Booking & Consultation (`BookingService`)
| Function | Endpoint/Action | Description |
| :--- | :--- | :--- |
| `bookConsultation(consultantId, date, time)` | POST `/bookings/book` | Attempts to book a new consultation slot. |
| `getBookingAvailability(consultantId, date)` | GET `/bookings/availability` | Checks available time slots for a specific day. |
| `getBookingDetails(bookingId)` | GET `/bookings/{bookingId}` | Fetches all details associated with a confirmed booking. |

#### 3. Core Profile & Content (`UserService`)
| Function | Endpoint/Action | Description |
| :--- | :--- | :--- |
| `updateProfile(data)` | PATCH `/user/profile` | Updates user-provided data (e.g., bio, phone). |
| `getConsultantProfile(consultantId)` | GET `/consultants/{id}` | Fetches rich, public-facing profile data. |
| `searchConsultant(query)` | GET `/consultants/search` | Executes a complex search query against the consultant database. |

***

## ⚠️ Error Handling & Best Practices

1.  **Idempotency:** All write operations (POST/PATCH) should be designed to be idempotent where possible.
2.  **Token Management:** Ensure authentication tokens are handled securely and refreshed proactively.
3.  **Rate Limiting:** Implement client-side and server-side rate limiting, especially on the `searchConsultant` and `bookConsultation` endpoints.
4.  **Retry Logic:** For network-related failures, implement exponential backoff retry logic.

*(End of document)*