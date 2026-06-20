# 🛡️ Storage Service Security Verification Report

[⬅ Return to Main Compendium](../../README.md)

## 🎯 Overview

This document provides a security and technical review of the `storage` package, which implements file handling functionality using Amazon S3. The service provides methods for uploading user avatars, general media files, blog covers, and deleting objects.

While the structure uses appropriate Go standard practices (like `defer src.Close()`), several critical areas related to input sanitization, context handling, and underlying cloud configuration (IAM/Environment Variables) introduce significant security risks that must be addressed before production deployment.

---

## 📝 Security Vulnerability Summary

| Vulnerable Component | Function/Payload | Description | Priority |
| :--- | :--- | :--- | :--- |
| **Input Sanitization** | `objectKey`, `key` (all upload/delete functions) | Unsanitized `objectKey` and `key` inputs are susceptible to Path Traversal attacks, potentially allowing deletion or overwriting of files outside the intended storage path. | **High** |
| **Infrastructure/IAM** | All functions | Lack of explicit discussion on AWS IAM role assumption or usage of least privilege principle. Overly permissive credentials are the single largest risk. | **High** |
| **Context Handling** | `ConnectToS3Client`, `PutObject`, `DeleteObject` | Frequent use of `context.TODO()` means that context cancellation or timeouts cannot be properly enforced, leading to potential resource leaks or hanging operations. | **Medium** |
| **Error Handling/Logging** | All functions | Error logging uses the standard `log` package, which is non-structured. In a production environment, robust, structured logging is mandatory for auditing and tracing. | **Medium** |
| **Code Quality/Tech Debt** | Global/Helper Functions | Reliance on `getEnv` and default bucket names ("lokask-media"). These magic strings reduce flexibility and increase coupling. | **Low** |

---

## 📂 Detailed Analysis

### 🌟 `storage.go`

#### Description
The file implements the `FileStorage` interface using `S3Client` to manage file lifecycle operations (uploading, deleting) against AWS S3. It handles specific business contexts like user avatars and blog covers, ensuring dedicated keys and buckets where possible.

#### 🔍 Security Concerns
1. **Path Traversal (High Risk):** Functions like `UploadFile` and `DeleteFile` accept `objectKey` (or `key`) as parameters. If these keys are derived from user input without validation (e.g., checking for `../`, absolute paths), an attacker could traverse the bucket structure to delete or overwrite critical files belonging to other resources.
2. **Least Privilege Violation (High Risk):** The code assumes a valid AWS setup but does not mandate or verify that the underlying IAM role attached to the service account is restricted only to the necessary `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` actions, and only on the specific required buckets.
3. **Context Leakage (Medium Risk):** Repeated use of `context.TODO()` bypasses proper context propagation. If the calling function has a deadline or needs cancellation, the S3 operations will ignore it, potentially leading to resource exhaustion or unresponsive services.

#### 💡 Suggested Fixes
1. **Mandatory Key Sanitization:** Implement rigorous input validation on all key generation and key inputs. The key must be normalized (e.g., using regex or path functions that prevent `..`) and restricted to a predefined character set.
2. **Context Propagation:** Always pass the receiving context (e.g., `ctx` from the caller function) to `s.Client.PutObject` and `s.Client.DeleteObject`.
3. **Input Source Review:** For `objectKey` and `key`, determine if they *must* come from the user. If they must, the input must be strictly validated before use in S3 API calls.

---

### 🎯 Function-Specific Vulnerability Assessment

#### 🖼️ `UploadProfilePicture(file *multipart.FileHeader, userID string)`
*   **Vulnerability:** The `userID` is directly integrated into the `objectKey` template. If `userID` is not sanitized, path traversal via `userID` is possible.
*   **Mitigation:** Sanitize `userID` to ensure it only contains safe alphanumeric characters.
*   **Priority:** Medium

#### 💾 `UploadFile(file *multipart.FileHeader, ownerID string, objectKey string)`
*   **Vulnerability:** This function accepts an external `objectKey`. This is the most direct point of failure for Path Traversal.
*   **Mitigation:** Strict validation of `objectKey` input is critical.
*   **Priority:** High

#### 📚 `UploadBlogCover(file *multipart.FileHeader, blogID string)`
*   **Vulnerability:** Similar to `UploadProfilePicture`, the `blogID` is unsanitized.
*   **Mitigation:** Sanitize `blogID` input.
*   **Priority:** Medium

#### 🗑️ `DeleteFile(ctx context.Context, key string)`
*   **Vulnerability:** Accepts an external `key`. This function is highly dangerous because deleting a malicious key (e.g., a bucket configuration file or another user's avatar) is possible if the key is not validated.
*   **Mitigation:** Strict validation of the `key` input is mandatory.
*   **Priority:** High

---

## ⚠️ Warning (Technical Debt & Urgent Action)

### 🛑 Context Usage
The function `ConnectToS3Client` uses `context.TODO()`. This signals that the context dependency is unknown or ignored. **This must be refactored to accept a proper `context.Context` argument.** All subsequent calls using `context.TODO()` should be replaced with the passed context.

### 🚨 Environment Variable Reliance
The use of `getEnv("AWS_S3_...")` makes the service highly dependent on environment variable configuration. While this is standard for cloud deployment, there is no fallback logic if the environment variable *itself* is empty or invalid. **Consider mandatory validation checks for all required bucket environment variables.**

## 📘 Notes (Design & Best Practices)

1. **Error Handling:** While error logging (`log.Printf`) is present, this pattern should be replaced with a structured logging library (e.g., Zap, Logr) to ensure that logs include standardized fields like `trace_id`, `service`, and `level`.
2. **URL Construction:** The URL construction logic relies on `fmt.Sprintf` and hardcoded AWS endpoint formats. It is generally safer and more resilient to use AWS SDK functions or proper resource clients to generate URIs, as bucket endpoint structures can change based on region and setup (e.g., virtual hosted style vs. path style).
3. **Magic Strings:** The default bucket names (`"lokask-user-avatars"`, `"lokask-media"`) should ideally be defined as package-level constants rather than relying solely on `getEnv()` fallback logic to improve code readability and maintainability.

---
*This analysis is complete. Focus immediate refactoring efforts on input sanitization and context awareness.*