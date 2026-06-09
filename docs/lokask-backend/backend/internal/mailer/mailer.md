# 📧 Mailer Service Component Documentation

This document provides a comprehensive architectural overview, usage guide, and security review for the `mailer` package, responsible for handling outbound notification emails within the Lokask platform.

---

## 🔭 Overview

The `mailer` package encapsulates the logic required to send standardized HTML notification emails using the Simple Mail Transfer Protocol (SMTP). Its primary function is to generate visually styled messages when a significant event occurs, such as receiving a new internal message, and reliably deliver these notifications to specified user endpoints.

This service acts as a dedicated external communication layer, abstracting the complex details of SMTP interaction and email formatting from the core business logic.

### System Flow

1.  **Initialization:** A `MailService` instance is created with mandatory SMTP credentials.
2.  **Template Generation:** The `SendMessageNotification` method constructs the full email body, including styling, dynamic content injection, and necessary headers, utilizing a hardcoded HTML template.
3.  **Sending:** The service uses the `net/smtp` package to authenticate and transmit the message via the configured SMTP host and port.
4.  **Reporting:** Success or failure of the delivery attempt is logged.

---

## ⚙️ Detail

### 📁 Data Structures

#### `MailService`
This struct holds all the necessary connection parameters and credentials for the SMTP server.

| Field | Type | Description | Usage Context |
| :--- | :--- | :--- | :--- |
| `Host` | `string` | The hostname of the SMTP server. | Required |
| `Port` | `string` | The port number the SMTP server listens on (e.g., "587", "465"). | Required |
| `Username` | `string` | The authenticated username for the SMTP account. | Required |
| `Password` | `string` | The password or token for the SMTP account. | Required |
| `From` | `string` | The verified sender address (the sender identity of the email). | Required |

#### `NewMailService` (Constructor)
This function initializes and returns a pointer to a configured `MailService` instance, ensuring all required connection parameters are provided immediately upon instantiation.

### 🚀 Methods

#### `SendMessageNotification(toEmail, toName, senderName, messagePreview string)`
This is the core method responsible for constructing and sending the notification email.

**Parameters:**

*   `toEmail` (`string`): The target email address recipient.
*   `toName` (`string`): The full name of the recipient (used in the greeting).
*   `senderName` (`string`): The name of the user who sent the message.
*   `messagePreview` (`string`): A snippet or preview of the message content.

**Execution Logic:**

1.  **Content Assembly:** The method first builds the email subject and MIME headers.
2.  **HTML Body Generation:** A complex, multi-line HTML structure is built using `fmt.Sprintf`. This template is highly styled, aiming for a polished, branded look. It dynamically injects the `toName`, `senderName`, and `messagePreview` into the content placeholders.
3.  **Authentication:** SMTP connection authentication is established using `smtp.PlainAuth`.
4.  **Transmission:** The assembled message (`msg`) is passed to `smtp.SendMail(addr, auth, m.From, []string{toEmail}, msg)`.
5.  **Logging:** The process logs the attempted connection details and provides clear status messages (`[INFO]` or `[ERROR]`) upon completion.

---

## 📝 Note (Best Practices & Operational Notes)

*   **Error Handling:** The current implementation correctly captures and logs SMTP errors, which is vital for operational monitoring.
*   **Branding:** The use of inline CSS within the HTML body ensures cross-client compatibility for basic styling, improving the visual consistency of the Lokask brand across different email clients.
*   **Single Responsibility:** The package successfully adheres to the Single Responsibility Principle by focusing solely on email communication, keeping business logic clean.
*   **Logging Clarity:** The log statements include helpful identifiers (e.g., `[MAILER]`, `[ERROR]`, `[INFO]`), which significantly aid in debugging and log aggregation tools (like ELK/Grafana).

---

## ⚠️ Warning (Architectural Concerns & TO-DO Items)

The following points represent significant technical debt, security risks, or areas that require immediate architectural review before this component can be considered production-grade.

### 🚨 1. Security and Credential Management (CRITICAL)
*   **Issue:** SMTP credentials (`Password`) are stored directly as fields in the `MailService` struct, implying they might be passed through memory or potentially committed to configuration files.
*   **Risk:** High risk of credential leakage.
*   **Remediation:** Credentials **must not** be handled as plain struct fields. They should be fetched at runtime from a secure secrets management solution (e.g., AWS Secrets Manager, HashiCorp Vault, or secure environment variables accessed via a dedicated configuration loader).

### 🚨 2. Templating Engine Usage (MAINTENANCE)
*   **Issue:** The HTML body is generated using complex `fmt.Sprintf` string interpolation.
*   **Risk:** This method is brittle, difficult to read, and prone to escaping issues if the input (`messagePreview`) contains characters that mess up the HTML structure.
*   **Remediation:** Migrate the template logic to use Go's `text/template` or `html/template` package. This provides robust parameter binding, automatic escaping, and significantly improves template maintainability.

### 🚨 3. Robustness and Resilience (INFRASTRUCTURE)
*   **Issue:** The current implementation executes the send command once. There is no retry mechanism or circuit breaker pattern.
*   **Risk:** Transient network issues or temporary SMTP server unavailability will result in immediate failure without attempting to reconnect or retry the send.
*   **Remediation:** Implement a retry loop (e.g., exponential backoff) around `smtp.SendMail`. Consider wrapping the service in a mechanism that handles overall service degradation (Circuit Breaker pattern).

### 🚨 4. Content Type and Encoding (COMPREHENSIVENESS)
*   **Issue:** While the MIME headers specify `charset="UTF-8"`, the body generation mechanism should ensure that all input strings (especially `messagePreview`) are properly encoded before concatenation to prevent malformed email payloads.

### 🗺️ Suggested Future Enhancements

*   **Plurality:** Implement a bulk send function that processes a slice of recipients, improving efficiency for mass notifications.
*   **Webhooks:** Introduce an option to trigger internal webhooks upon successful or failed email delivery, allowing other microservices to react to communication failures.
*   **Config Object:** Refactor the initialization to accept a configuration object instead of numerous individual parameters, improving usability and adherence to the Builder pattern.