#!/bin/bash

# --- 1. NETWORK CONFIGURATION ---
# It is safe to keep the internal hostname default (not a secret).
MINIO_ADDR="${MINIO_API:-http://minio:9000}" 

# --- 2. SECURE INPUT HANDLING ---
# Logic: Try to get from ENV first. If empty, ask the user manually.

if [ -z "$MINIO_USER" ]; then
    read -p "Enter MinIO Username: " MINIO_USER
fi

if [ -z "$MINIO_PASS" ]; then
    # -s hides the input characters for security
    read -s -p "Enter MinIO Password: " MINIO_PASS
    echo "" # Print a newline after the silent input
fi

# Hard Stop if still empty (e.g., user hit Enter without typing)
if [ -z "$MINIO_USER" ] || [ -z "$MINIO_PASS" ]; then
    echo "❌ Error: Credentials are required. Set MINIO_USER/PASS or enter manually."
    exit 1
fi

# --- 3. ARGUMENTS ---
DOCKER_NETWORK="$1"
SOURCE_DIR="$2"
BUCKET_NAME="$3"
DRY_RUN_FLAG="$4"

# --- 4. VALIDATION ---
if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Usage: ./upload_scripts.sh <network> <dir> <bucket> [--dry-run]"
    exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Directory '$SOURCE_DIR' does not exist."
    exit 1
fi

ABS_PATH=$(cd "$SOURCE_DIR" && pwd)

# --- 5. DRY RUN LOGIC ---
CMD_APPEND=""
if [ "$DRY_RUN_FLAG" == "--dry-run" ]; then
    echo "🚧 DRY RUN ACTIVE"
    CMD_APPEND="--fake"
fi

echo "🚀 Starting Upload..."
echo "   Target:  $MINIO_ADDR/$BUCKET_NAME"
echo "   User:    $MINIO_USER"

# --- 6. EXECUTE ---
docker run --rm \
    --network "$DOCKER_NETWORK" \
    --entrypoint /bin/sh \
    -e MINIO_ADDR="$MINIO_ADDR" \
    -e MINIO_USER="$MINIO_USER" \
    -e MINIO_PASS="$MINIO_PASS" \
    -e BUCKET_NAME="$BUCKET_NAME" \
    -e CMD_APPEND="$CMD_APPEND" \
    -v "$ABS_PATH:/upload" \
    minio/mc:latest \
    -c "
    # A. Connect
    if ! mc alias set local \$MINIO_ADDR \$MINIO_USER \$MINIO_PASS > /dev/null 2>&1; then
       echo '❌ CONNECTION FAILED: Invalid credentials or network.'
       exit 1
    fi

    # B. Create Bucket (Skip in dry run unless necessary logic requires it)
    if [ \"\$CMD_APPEND\" != \"--fake\" ]; then
        if ! mc ls local/\$BUCKET_NAME > /dev/null 2>&1; then
            mc mb local/\$BUCKET_NAME
        fi
        mc anonymous set download local/\$BUCKET_NAME
    else
        echo '[DRY RUN] Would create bucket and set public policy.'
    fi

    # C. Upload
    echo '...Syncing files...'
    mc mirror --overwrite \$CMD_APPEND /upload local/\$BUCKET_NAME;
    "

echo "✅ Task complete!"