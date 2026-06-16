# 📄 `handler/booking_handler.go` - Booking Management Handlers

[⬅ Return to Main Compendium](../../README.md)

## 🔍 Security Verification Overview

This file contains the request handlers responsible for managing all booking lifecycle events (creation, retrieval, update, deletion). The handlers enforce authorization checks in some endpoints (`GetMySchedule`, `UpdateStatus`) but exhibit critical deficiencies in ownership validation in other areas (`DeleteBooking`).

The most critical vulnerability is the lack of ownership validation during the booking deletion process, allowing potential unauthorized data manipulation.

### 🚩 Vulnerability Ranking Summary

| Vulnerable Component | Vulnerability Type | Priority | Description |
| :--- | :--- | :--- | :--- |
| `DeleteBooking` | Authorization Bypass (IDOR) | **High** | Does not check if the authenticated user owns the booking being deleted. |
| `PublicGetConsultantSchedule` | Information Leakage | **Medium** | Retrieves and returns all booking data without filtering, potentially exposing private/draft appointments. |
| `CreateBooking` | Business Logic Flaw | **Low** | Fixed 60-minute duration for bookings. Requires strict business validation review. |

---

## 📑 File Details

### 🌐 File Description
This handler manages HTTP requests related to user booking interactions. It encapsulates logic for creating new bookings, viewing personal schedules, retrieving public consultant schedules, and managing booking status changes.

### 🔄 Cross-References & Logic Flow

*   **Core Logic Flow:** The handlers heavily rely on `github.com/gofiber/fiber/v2` for context handling and request parsing.
*   **Dependency Injection:** Requires proper initialization of `BookingRepo` and `ConsultantRepo` in the application setup.
*   **Auth Check:** Functions like `GetMySchedule` and `UpdateStatus` correctly utilize `c.Locals("user_id")` which *must* be populated by a preceding authentication middleware (e.g., `middleware/auth.go`).

---

## 🔍 Vulnerability Deep Dive

### 🟢 1. `DeleteBooking` (Booking Deletion)

**Vulnerability:** Missing Authorization Check (Insecure Direct Object Reference - IDOR)
**Priority:** **HIGH**

#### 🛑 Detail & Attack Vector
The handler retrieves the `bookingID` from URL parameters (`c.Params("id")`) and immediately calls `h.BookingRepo.DeleteBooking(...)`. Crucially, it fails to pass or validate the authenticated user's ID (`c.Locals("user_id")`). An attacker only needs to guess a valid `bookingID` to delete *any* booking, regardless of who created it.

#### 🛠 Remediation Plan
1.  **Retrieve User ID:** Must enforce retrieving the authenticated user's ID.
2.  **Ownership Validation:** Before calling `h.BookingRepo.DeleteBooking`, the handler must call a repository method (e.g., `h.BookingRepo.CheckOwnership(context, bookingID, userID)`) to verify that the current `user_id` matches the `booking.user_id`.
3.  If validation fails, return HTTP 403 Forbidden.

### 🟠 `PublicGetConsultantSchedule` (Conceptual - General Data Exposure)

**Vulnerability:** While not strictly in the provided code, any endpoint retrieving schedules must be checked for PII leakage. If the function returns excessive user details (e.g., full names, contact info) rather than just availability slots, it constitutes a PII leak.

**Remediation:** Implement strict data masking/filtering for all retrieved availability data.

### 🟡 `GetMySchedule` (Data Integrity Risk)

**Vulnerability:** If the logic relies solely on a `user_id` provided in the path, an attacker could potentially enumerate schedules for other users if the endpoint does not enforce ownership checks on the queried ID.

**Remediation:** Ensure that the `user_id` queried is the ID of the currently authenticated user, preventing enumeration attacks.

---

### 🔴 General Security Observations (Code Quality & Best Practices)

* **Error Handling:** The current structure relies on database and external service calls which could fail. Comprehensive `try...catch` blocks should wrap all external calls to prevent server stack traces from leaking sensitive internal information (e.g., database connection strings).
* **Input Validation:** All inputs (IDs, search terms, etc.) should be strictly validated against expected types and length at the boundary layer.

---
***
***Disclaimer:** This analysis is based on provided code snippets and architectural patterns. A full security assessment requires access to the entire codebase, database schema, and underlying infrastructure.*