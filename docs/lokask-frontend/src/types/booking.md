# 📘 Data Contract Definition: Booking Management System

**Component:** `Booking` Data Models
**Version:** 1.0.0
**Date Generated:** October 26, 2023
**Author:** Documentation Engineering Team

## 📋 Overview

This document defines the canonical data structures (TypeScript interfaces) used for managing booking records within the consultation platform. These interfaces establish the contract for both the data stored in the backend persistence layer (PostgreSQL) and the payload required when creating a new booking via API endpoints.

Understanding these structures is critical for services responsible for booking creation, retrieval, and status updates.

---

## 🔍 Detail Analysis

### 1. Enumeration Types (Domain Constraints)

These types enforce strict values for system-defined states, improving data integrity and preventing invalid state transitions.

| Type | Purpose | Available Values | Description |
| :--- | :--- | :--- | :--- |
| `ServiceType` | Defines the nature of the consultation. | `"chat_only"`, `"video_call"`, `"voice_call"`, `"itinerary_review"` | Determines the operational mode of the scheduled meeting. |
| `BookingStatus` | Tracks the lifecycle stage of the booking. | `"pending"`, `"confirmed"`, `"completed"`, `"cancelled"` | Used to ensure that business logic (e.g., payment processing) only runs when appropriate. |

### 2. `Booking` Interface (Database Read Model / Output)

This interface represents the comprehensive data object retrieved from the PostgreSQL database. It combines core booking details, management metadata, and auxiliary fields joined from related user records.

| Field | Type | Mandatory | Description | System Source |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique identifier for the booking record. | Primary Key |
| `consultant_id` | `string` | Yes | ID of the consulting service provider. | Foreign Key |
| `user_id` | `string` | Yes | ID of the end-user client. | Foreign Key |
| `start_time` | `string` | Yes | Start date and time of the booking. **(ISO 8601 format)** | DB Field |
| `end_time` | `string` | Yes | End date and time of the booking. **(ISO 8601 format)** | DB Field |
| `service_type` | `ServiceType` | Yes | The defined type of service provided. | DB Field |
| `status` | `BookingStatus` | Yes | The current status of the booking. | DB Field |
| `total_price` | `number` | Yes | The final cost of the service (currency unit assumed). | DB Field |
| `user_notes` | `string` | Yes | Detailed notes provided by the user regarding the consultation. | DB Field |
| `created_at` | `string` | Yes | Timestamp of record creation. **(ISO 8601)** | Metadata |
| `updated_at` | `string` | Yes | Timestamp of last record modification. **(ISO 8601)** | Metadata |
| `traveller_name?` | `string` | No | Name of the end-user (View-joined). | Database Join |
| `traveller_avatar?` | `string` | No | URL or identifier for the end-user's avatar. | Database Join |
| `traveller_location?` | `string` | No | Geographic location of the end-user (View-joined). | Database Join |
| `consultant_name?` | `string` | No | Name of the consultant (View-joined). | Database Join |
| `consultant_avatar?` | `string` | No | URL or identifier for the consultant's avatar. | Database Join |
| `consultant_city?` | `string` | No | City of the consultant (View-joined). | Database Join |

### 3. `CreateBookingRequest` Interface (API Write Model / Input)

This interface defines the payload structure required when a client (or intermediary service) attempts to book a new consultation. It contains only the fields necessary for the transaction initiation.

| Field | Type | Mandatory | Constraints / Notes |
| :--- | :--- | :--- | :--- |
| `consultant_id` | `string` | Yes | The target consultant ID. |
| `start_time` | `string` | Yes | **Must be a valid ISO 8601 string.** |
| `service_type` | `ServiceType` | Yes | Must match an enumerated `ServiceType`. |
| `user_notes` | `string` | Yes | Textual notes for the consultation. |
| `total_price` | `number` | Yes | The agreed-upon price for the service. |

---

## 💡 System Context & Architecture Notes

### Data Consistency (System Design)
The `Booking` interface is designed as a composite view, pulling data from multiple source tables (e.g., `users`, `consultants`, `bookings`). The use of optional fields (`?`) for user/consultant details is crucial, indicating that these fields may be null if the corresponding join fails or if the data is not yet available.

### Time Management (Infrastructure/Security)
All time fields (`start_time`, `end_time`, `created_at`, `updated_at`) *must* be handled as UTC (Coordinated Universal Time) and stored/transferred using the ISO 8601 standard. Any time zone handling logic must occur **before** serialization to the string format.

### Payment Flow Integration (System Design)
The `total_price` field is a critical component that represents the finalized financial agreement. Any business logic changing this value (e.g., tax adjustments, discounts) must be atomic, verifiable, and traceable, potentially requiring a dedicated payment service integration hook.

---

## ⚠️ Warning & Security Recommendations

1.  **PII Handling:** The `user_id` and related view fields (names, locations) constitute Personally Identifiable Information (PII). **All services accessing this data must adhere to strict access control policies.** Role-Based Access Control (RBAC) must limit who can view the `user_notes` or view the `user_id`.
2.  **Timezone Ambiguity:** While the fields mandate ISO strings, the code definition does not enforce the time zone component (e.g., `Z` or `+00:00`). Assume that the database layer enforces UTC storage, but the API consuming this should validate the presence of timezone metadata.
3.  **Data Validation Gaps:** This definition only outlines the *structure*. Validation rules are missing (e.g., Is `total_price` always positive? Is `end_time` always later than `start_time`?). The API layer must implement exhaustive validation logic (Schema Validation) for all incoming requests.
4.  **Idempotency:** When processing bookings, the system must account for potential network failures and retries. The creation mechanism should be idempotent to prevent double-booking charges or duplicate records based on the input payload.

---

## 📝 Notes for Future Development

*   **Cancellation Logic:** The current structure defines `status: BookingStatus`. When implementing the "cancel" path, ensure that the system records *who* cancelled the booking and *when* they requested cancellation.
*   **Payment Integration:** Consider adding a `payment_reference_id` field to the `Booking` interface to link the booking record directly to a financial transaction record.
*   **Scheduling Conflict:** The current model assumes that the input `start_time` and `end_time` are available at creation. The API service layer needs robust pre-validation logic to check for scheduling conflicts against existing booked slots for both the user and the consultant.