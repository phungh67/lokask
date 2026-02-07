#!/bin/bash
# Usage: ./script.sh <pattern> <usersession name>
# Example: ./script.sh sandbox temp-session

# global options
PATTERN="${1:-}"
SESSION_PREFIX="${2:-terraform}"
LOG_DIR="log-execution"
TIME_STAMP=$(date +"%d_%m_%Y")
LOG_TIME=$(date +"%H:%M")
ROLE_PATTERN="arn:aws:iam::account_id:role/OrganizationAccountAccessRole"

#set -euo pipefail

assume_role () {
  echo "[INFO][$LOG_TIME] Searching for AWS account matching pattern: $PATTERN" >> "${LOG_DIR}-${TIME_STAMP}.log"
  # search through the organization list to check the account with matched pattern
  local account_id=$(aws organizations list-accounts --query 'Accounts[*].[Name, Id]' --output json \
  | jq -r --arg pat "$PATTERN" 'map(select(.[0] | test($pat; "i"))) | .[] | .[1]')
  
  local role_name=$(echo "${SESSION_PREFIX}-$TIME_STAMP")
  
  local role_to_assume=$(echo "${ROLE_PATTERN}" | sed "s/account\_id/${account_id//$'\n'/}/g")

  # echo $role_to_assume
  # echo $role_name

  # echo $(aws sts assume-role \
  #  --role-arn "${role_to_assume}" \
  #  --role-session-name "${role_name}")
  if [[ -z "$account_id" || "$account_id" == "null" ]]; then
    echo "[ERROR][$LOG_TIME] No account found matching pattern '$PATTERN'" >> "${LOG_DIR}-${TIME_STAMP}.error"
    return
  fi

  CREDS_JSON=$(aws sts assume-role \
    --role-arn "${role_to_assume}" \
    --role-session-name "${role_name}")

  if [[ -n $CREDS_JSON ]]; then
    echo "[INFO][$LOG_TIME] Successfully assume role with credentials" >> "${LOG_DIR}-${TIME_STAMP}.log"
  fi

  echo "export AWS_ACCESS_KEY_ID=$(echo "$CREDS_JSON" | jq -r '.Credentials.AccessKeyId')"
  echo "export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS_JSON" | jq -r '.Credentials.SecretAccessKey')"
  echo "export AWS_SESSION_TOKEN=$(echo "$CREDS_JSON" | jq -r '.Credentials.SessionToken')"
}


if [ -z "$PATTERN" ]; then
  echo "Usage: $0 <pattern>"
fi

# echo $ACCOUNT_ID
# echo $ASSUMED_ROLE
assume_role
