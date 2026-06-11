```markdown
[⬅ Return to Main Compendium](../../README.md)

# 📧 Mail Service Module (`mailer`)

**Component Owner:** Documentation Engineering / Backend Services
**Status:** MVP - Operational (Requires Credential Management Refinement)
**Last Updated:** 2024-XX-XX
**Module:** Communications / Notifications

---

## 🔍 Overview

The `mailer` package provides a robust, reusable service layer for sending structured, HTML-formatted email notifications. This module is primarily responsible for sending "New Message" alerts to users on the Lokask platform.

It encapsulates the complexity of SMTP interaction, ensuring that business logic consumers only need to call a simple sending function, abstracting away the details of authentication, MIME construction, and connection handling.

**Key Functions:**
*   Initializes the connection parameters required for SMTP communication.
*   Generates a rich, branded HTML body for consistent notification formatting.
*   Handles the secure transmission of the message via configured SMTP endpoints.

---

## 📝 Detail and Implementation Logic

### 1. `MailService` Structure

The service configuration is managed by the `MailService` struct, requiring five core parameters:

| Field | Type | Description | Security Impact |
| :--- | :--- | :--- | :--- |
| `Host` | `string` | The SMTP server hostname (e.g., `smtp.sendgrid.net`). | Low |
| `Port` | `string` | The SMTP service port (e.g., `587` or `465`). | Low |
| `Username` | `string` | The authenticated SMTP username. | High |
| `Password` | `string` | The corresponding SMTP password/API key. | **CRITICAL** |
| `From` | `string` | The verified sender email address. | Medium |

**Initialization Flow:**
The `NewMailService` constructor must be used to instantiate the service. This ensures that the connection parameters are validated and stored safely before any communication attempts are made.

### 2. `SendMessageNotification` Method

This is the primary entry point for the module. It constructs and sends the notification email:

**Signature:**
```go
func (m *MailService) SendMessageNotification(toEmail, toName, senderName, messagePreview string)
```

**Execution Flow:**
1. **Subject Construction:** Creates a descriptive subject line using the `senderName`.
2. **MIME Construction:** Prepends standard MIME headers (`MIME-version`, `Content-Type`) necessary for reliable HTML transport.
3. **Body Templating:** Uses `fmt.Sprintf` to inject dynamic content (Recipient Name, Sender Name, Message Preview) into a large, structured HTML template. *The template includes fixed CSS styling for branding consistency.*
4. **SMTP Authentication:** The `smtp.PlainAuth` method handles the authentication process using the configured credentials.
5. **Transmission:** `smtp.SendMail` attempts the connection and transmission.
6. **Logging:** Comprehensive logging (`[INFO]`, `[ERROR]`) is implemented to track success, failure, and details of the communication attempt.

#### 🌐 Internal Code Flow Reference
*   **SMTP Authentication:** `auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)` (Self-contained logic, no external links needed).
*   **Error Handling:** Relies on standard Go `if err != nil` checks for failure logging.

---

## ⚠️ Warnings and Technical Debt (🚨 Action Required)

**SECURITY CRITICAL:**
1. **Credential Management:** The `Password` field currently stores the raw password/API key. **This must be immediately refactored** to consume credentials from secure environment variables (e.g., `os.Getenv("SMTP_PASSWORD")`) or a dedicated Secrets Manager (AWS Secrets Manager, HashiCorp Vault). Hardcoding credentials is a major vulnerability.
2. **Hardcoded Magic Strings:** The HTML body contains multiple hardcoded strings (e.g., `Lokask`, the CTA link `https://lokask.com/dashboard`, CSS colors `#C56A49`). These should be extracted into a separate, configurable constant file or passed as part of a global configuration object to allow localization and rebranding without code changes.
3. **Logging Leakage:** The function logs sensitive connection details (`[MAILER] Current information destination address: %s, sender: %s`). Review logging policies to ensure production logs do not expose raw connection details.

---

## 💡 Notes and Recommendations (🚀 Future Scope)

1. **Retry Mechanism:** The current implementation attempts sending once. For mission-critical notifications, implement a **robust retry mechanism** with exponential backoff to handle transient network failures.
2. **Rate Limiting & Queuing:** If this service scales significantly, introducing a queue (e.g., Redis/Kafka) and a dedicated worker pattern is strongly recommended to prevent system bottlenecks and enforce per-minute sending limits mandated by providers.
3. **HTML Template Separation:** Refactor the large HTML string body into a dedicated template file (e.g., `templates/notification.html`) and use Go's `text/template` package. This dramatically improves maintainability and separation of concerns.
4. **Input Validation:** Add checks to ensure `toEmail` and `From` adhere to valid email formats before calling `smtp.SendMail` to prevent unnecessary network calls and improve stability.

---

## 🔗 Related Files and Components

| Component | Description | Link |
| :--- | :--- | :--- |
| **Email Templates** | Storage for the parameterized HTML content. | `../config/templates/mail_template.go` |
| **Configuration** | Global struct defining SMTP settings (should read from environment). | `../config/config_loader.go` |
| **Consumer Logic** | The service that calls `SendMessageNotification` (e.g., the Message Handler). | `../handlers/message_handler.go` |
| **Utilities** | Common helper functions (e.g., logging, sanitization). | `../utils/helpers.go` |
```