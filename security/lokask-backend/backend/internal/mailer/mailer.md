```markdown
[⬅ Return to Main Compendium](../../README.md)

# 📧 `mailer.go` - Email Notification Service
**Component:** Mailer/Notification System
**Purpose:** Handles outgoing email communications (message notifications, account verifications) using the Resend API.

## 🚀 Overview
This file defines the `MailService` structure and provides methods to send various types of emails. It utilizes the external `github.com/resend/resend-go/v3` library. Key functions include `SendMessageNotification` for sending user message alerts and `SendVerificationEmail` for account verification workflows.

The service abstraction is generally clean, but several methods handle user-supplied strings (like names, previews, and tokens) which are used in email templates or URLs. This requires careful security review to prevent template injection or XSS.

## 🛡️ Security Vulnerability Analysis

### 🔍 High Priority Issues

| Feature/Function | Vulnerability Type | Description | Priority |
| :--- | :--- | :--- | :--- |
| `SendMessageNotification` | Cross-Site Scripting (XSS) | `toName` and `messagePreview` are user-controlled inputs injected directly into the email template variables. If the template doesn't properly sanitize HTML/input content, an attacker could embed malicious scripts (e.g., `<script>alert(1)</script>`). | **High** |
| `SendVerificationEmail` | Injection/Trust Boundary Violation | The `token` is concatenated into a URL using `fmt.Sprintf`. If the token input is not strictly sanitized (e.g., only allowing UUID formats or alphanumeric characters), it could allow injection or point to unexpected endpoints, compromising the verification flow trust. | **High** |

**Detailed Fixes/Mitigations:**
1. **XSS Mitigation (Templates):** All user-supplied data used in templates (`toName`, `messagePreview`) must be strictly HTML-escaped *before* being passed to the `resend.Variables` map, or the email template system must guarantee robust output encoding.
2. **Token Validation:** Implement strict validation on the `token` parameter in `SendVerificationEmail`. It should only accept tokens matching the expected format (e.g., regex matching a specific token length/pattern).

### 🟡 Medium Priority Issues

| Feature/Function | Vulnerability Type | Description | Priority |
| :--- | :--- | :--- | :--- |
| All Email Sending Functions | Credential Handling (Leakage) | The `NewMailService` function accepts `apiKey`. While this is necessary, the calling service must ensure this API key is loaded from a secure environment variable and never hardcoded or logged. | **Medium** |
| All Email Sending Functions | Error Logging (PII Leakage) | Error logging (`log.Printf`) often includes parameters like `toEmail` and the error details. Ensure that log retention policies are enforced to prevent the accidental logging and retention of sensitive PII (email addresses, error stacks). | **Medium** |

### 🟢 Low Priority Issues

| Feature/Function | Vulnerability Type | Description | Priority |
| :--- | :--- | :--- | :--- |
| `SendMessageNotification` | Hardcoded Sender Address | The `From` field inside `SendMessageNotification` is hardcoded to `"Notification <notification@lokask.se>"`. It should ideally use the `m.From` struct field for consistency and centralized management. | **Low** |

---

## 📝 Developer Notes & Warnings

### ⚠️ Critical Warnings (Tech Debt / Missing Logic)
1. **Input Sanitization:** The most significant flaw is the lack of input sanitization for all external inputs used in the email body or URL. This is an urgent fix.
2. **Token Validation:** The `SendVerificationEmail` function trusts the `token` input implicitly. A dedicated, secure token generation and validation service (e.g., checking if the token exists and is not expired in a database) must precede calling this mailer function.

### 💡 Important Design Points
*   **Abstraction:** The service provides good abstraction over the underlying Resend API.
*   **Dependency Management:** Ensure that the `apiKey` used for initialization (`NewMailService`) is treated as a highly sensitive secret.

---

## 🔗 Related Code Flow & Documentation Links

*   **Token Generation/Validation:**
    *   [Verification Token Service Logic](../../pkg/tokens/token_manager.go) (MUST check token existence/expiry before calling `SendVerificationEmail`).
*   **Calling Code Logic:**
    *   [User Message Handler Middleware](../../middlewares/message_handler.go) (Responsible for sanitizing `messagePreview` and `toName` before calling `SendMessageNotification`).
*   **Configuration:**
    *   [Application Configuration Loading](../../config/config.go) (Ensuring `apiKey` and `from` are correctly loaded via env vars).

---
*(Figure: Example of input sanitization flow visualization)*

**Input Flow Diagram (Conceptual):**

`External Input (User/API Call)` $\xrightarrow{\text{Needs Sanitization}}$ `Sanitization Layer (HTML/Regex)` $\xrightarrow{\text{Safe String}}$ `MailService Method` $\rightarrow$ `Resend API Call`

**Sanitization:** Crucial intermediary step to prevent XSS and injection.
```