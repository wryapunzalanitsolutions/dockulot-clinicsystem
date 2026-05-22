#!/usr/bin/env bash
set -euo pipefail

# Usage:
# SUPABASE_URL="https://vhuzrqmytlahgkmqhzxi.supabase.co" \ 
# SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXpycW15dGxhaGdrbXFoenhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI0Njc3OCwiZXhwIjoyMDk0ODIyNzc4fQ.BYcpbrVsayDXLo9hLhhSGF0LktQnrCyCgAnyCgDhaR8" \ 
# ./scripts/create_test_accounts.sh

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: SUPABASE_URL and SERVICE_ROLE_KEY must be set in the environment." >&2
  echo "Example: SUPABASE_URL=\"https://xyz.supabase.co\" SERVICE_ROLE_KEY=\"...\" ./scripts/create_test_accounts.sh" >&2
  exit 1
fi

API="$SUPABASE_URL"
SRK="$SERVICE_ROLE_KEY"

# Test accounts to create
read -r -d '' ACCOUNTS <<'EOF'
superadmin@test.com|superadmin123|super_admin|Super Admin
admin@test.com|admin123|admin|Clinic Admin
dockulot@test.com|dockulot123|doctor|Dr. Dockulot
patienttest@test.com|patient123|patient|Test Patient
EOF

# Create a user via Admin API and then insert a profile row
while IFS='|' read -r email password role full_name; do
  echo "Creating user: $email"

  # Create auth user
  create_resp=$(curl -sS -X POST "$API/auth/v1/admin/users" \
    -H "Authorization: Bearer $SRK" \
    -H "Content-Type: application/json" \
    -d "{ \"email\": \"$email\", \"password\": \"$password\", \"email_confirm\": true }")

  user_id=$(echo "$create_resp" | jq -r '.id // empty')
  if [ -z "$user_id" ] ; then
    echo "Failed to create user $email. Response:" >&2
    echo "$create_resp" >&2
    exit 1
  fi
  echo " -> created user id: $user_id"

  # Insert profile row (profiles.id references auth.users.id)
  profile_payload=$(jq -n --arg id "$user_id" --arg email "$email" --arg name "$full_name" --arg role "$role" '{ id: $id, email: $email, full_name: $name, role: $role, created_at: (now|tostring) }')

  resp=$(curl -sS -X POST "$API/rest/v1/profiles" \
    -H "Authorization: Bearer $SRK" \
    -H "apikey: $SRK" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$profile_payload")

  echo " -> profile created for $email"
  sleep 0.3

done <<< "$ACCOUNTS"

echo "All test accounts processed."

echo "Notes:"
echo " - The script requires 'jq' installed to parse JSON responses. Install with your package manager (apt, brew, choco)."
echo " - It creates users via the Supabase Admin endpoint and inserts rows into the 'profiles' table."
echo " - Run this only in development or with a test project; the Service Role key has full privileges." 

exit 0
