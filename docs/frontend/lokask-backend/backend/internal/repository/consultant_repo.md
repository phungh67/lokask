[⬅ Return to Main Compendium](../../../../../../README.md)

The provided code snippet is a set of database interaction and business logic functions, likely belonging to a repository or service layer responsible for managing user profiles, specifically for "consultants."

The key areas that need improvement are:

1.  **Error Handling and Context:** Several methods assume success. Robust error handling is needed.
2.  **Transaction Management:** Any operation that modifies multiple related pieces of data (e.g., updating user details and associated logs) should be wrapped in a database transaction.
3.  **Input Validation:** Inputs (like IDs, strings) should be validated before being used in queries or logic.
4.  **Code Clarity and Readability:** Some SQL constructions or business logic can be cleaner.

Below is a detailed analysis and refactoring suggestion, focusing on improving the core functions like `GetConsultantProfile`, `UpdateConsultantDetails`, and `SearchConsultants`.

---

## Refactoring Suggestions

### 1. `GetConsultantProfile` (Read Operation)

This function relies on joining multiple tables. It's generally fine, but we should ensure proper error handling and use of `sql.ErrNoRows` semantics.

**Improvement:** Add specific error handling for database connectivity issues vs. "not found" scenarios.

### 2. `UpdateConsultantDetails` (Write Operation)

This updates multiple fields. It should be transactional if related actions occur (though here, it seems atomic enough for a single `UPDATE`).

**Improvement:** Use parameterized queries for all inputs to prevent SQL injection. Explicitly check if the `consultantID` exists *before* updating.

### 3. `SearchConsultants` (Query/Read Operation)

This function is complex as it involves searching across multiple criteria (skills, availability).

**Improvement:**
1.  **Efficiency:** Ensure the `WHERE` clause filters are optimally indexed in the database.
2.  **Pagination:** If this is for a list view, pagination (`LIMIT` and `OFFSET`) must be added to prevent resource exhaustion.
3.  **Query Building:** Use a more structured approach to build the dynamic `WHERE` clause rather than concatenating strings if the parameters change frequently.

### 4. `UpdateConsultantSkills` (Write Operation)

This performs an association update, which is error-prone (e.g., what if the skill ID doesn't exist?).

**Improvement:**
1.  **Transactional Safety:** The removal and addition of skills should ideally happen together or be validated against the existing state.
2.  **Validation:** Validate that all provided `skillIDs` are legitimate.

### 5. General Improvements (Error Handling & Transactions)

**Recommendation:** Wrap the execution logic in helper functions that handle `*sql.Error` types gracefully, returning standard Go errors or custom domain errors.

---

## Refactored Code Example (Conceptual)

Since the original code relies on a specific database connection (`db *sql.DB`), the refactoring assumes that the functions accept this connection and that proper context/error wrapping is implemented.

```go
package repository

import (
    "context"
    "database/sql"
    "fmt"
    "strings"
    // Import your actual database driver
)

// Assuming these structs/types are defined elsewhere
type ConsultantProfile struct {
    ID           int
    Name         string
    Bio          string
    Availability bool
    // ... other fields
}

type SearchCriteria struct {
    Skill      string
    MinRating  float64
    Available  bool
    Limit      int
    Offset     int
}

type Skill struct {
    ID   int
    Name string
}

// --- Helper function for standard error wrapping ---
func handleQueryError(err error, action string) error {
    if err == nil {
        return nil
    }
    // In a real application, you'd use context tracing/logging here
    return fmt.Errorf("failed to %s: %w", action, err)
}

// GetConsultantProfile retrieves detailed information for a consultant.
func (r *Repository) GetConsultantProfile(ctx context.Context, consultantID int) (*ConsultantProfile, error) {
    query := `
        SELECT c.id, c.name, c.bio, c.availability
        FROM consultants c
        WHERE c.id = $1
    `
    row := r.db.QueryRowContext(ctx, query, consultantID)
    
    profile := &ConsultantProfile{}
    var availabilityStr sql.NullString // Handle potential NULLs in the DB
    
    err := row.Scan(&profile.ID, &profile.Name, &profile.Bio, &availabilityStr)
    
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, fmt.Errorf("consultant with ID %d not found", consultantID)
        }
        return nil, handleQueryError(err, "retrieve profile")
    }
    
    // Apply logic for handling nullable columns
    profile.Availability = availabilityStr.Bool 
    
    return profile, nil
}

// UpdateConsultantDetails updates multiple fields for a consultant.
func (r *Repository) UpdateConsultantDetails(ctx context.Context, consultantID int, name string, bio string, availability bool) error {
    // Use transactions for atomicity if this update was part of a larger unit.
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return handleQueryError(err, "start transaction for update")
    }
    defer tx.Rollback() // Rollback if we return early
    
    query := `
        UPDATE consultants 
        SET name = $1, bio = $2, availability = $3 
        WHERE id = $4
    `
    
    result, err := tx.ExecContext(ctx, query, name, bio, availability, consultantID)
    if err != nil {
        return handleQueryError(err, "execute update statement")
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return handleQueryError(err, "check rows affected")
    }
    
    if rowsAffected == 0 {
        return fmt.Errorf("consultant with ID %d not found; no records updated", consultantID)
    }

    // Commit the transaction if all steps succeeded
    return tx.Commit()
}

// SearchConsultants finds consultants based on multiple criteria with pagination.
func (r *Repository) SearchConsultants(ctx context.Context, criteria SearchCriteria) ([]*ConsultantProfile, error) {
    // --- Build the query dynamically ---
    var (
        queryBuilder strings.Builder
        params []interface{}
        paramCounter int = 1
    )
    
    queryBuilder.WriteString(`
        SELECT c.id, c.name, c.bio, c.availability
        FROM consultants c
        WHERE 1=1
    `)
    
    if criteria.Skill != "" {
        queryBuilder.WriteString(fmt.Sprintf(" AND c.skills LIKE $%d", paramCounter))
        params = append(params, "%"+criteria.Skill+"%")
        paramCounter++
    }
    
    if criteria.MinRating > 0 {
        queryBuilder.WriteString(fmt.Sprintf(" AND c.rating >= $%d", paramCounter))
        params = append(params, criteria.MinRating)
        paramCounter++
    }
    
    if criteria.Available {
        queryBuilder.WriteString(" AND c.availability = $")
        params = append(params, true)
        paramCounter++
    }

    // Add pagination and ordering
    queryBuilder.WriteString(fmt.Sprintf(" ORDER BY c.rating DESC LIMIT $%d OFFSET $%d", paramCounter, paramCounter+1))
    params = append(params, criteria.Limit)
    params = append(params, criteria.Offset)
    
    finalQuery := queryBuilder.String()
    
    // --- Execution ---
    rows, err := r.db.QueryContext(ctx, finalQuery, params...)
    if err != nil {
        return nil, handleQueryError(err, "search consultants")
    }
    defer rows.Close()
    
    var profiles []*ConsultantProfile
    for rows.Next() {
        profile := &ConsultantProfile{}
        var availability sql.NullString
        if err := rows.Scan(&profile.ID, &profile.Name, &profile.Bio, &availability); err != nil {
            return nil, handleQueryError(err, "scan search results")
        }
        profile.Availability = availability.Bool
        profiles = append(profiles, profile)
    }
    
    if err = rows.Err(); err != nil {
        return nil, handleQueryError(err, "check search result iteration")
    }
    
    return profiles, nil
}
```