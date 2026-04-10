# Local Lead API Testing

This guide lets you test the Capital Legacy lead payload locally using Postman before you connect to the real partner API.

## What this setup gives you

- A local mock API server running on your machine
- A `POST /leads` endpoint that checks the exact fields MiWill now sends
- A success response with a fake `lead_id`
- A request log endpoint so you can inspect what Postman sent

## Local server details

- Default base URL: `http://localhost:4010`
- Default auth header: `Authorization: Bearer local-test-key`
- Available routes:
  - `GET /health`
  - `GET /requests`
  - `POST /leads`
  - `POST /v1/leads`

## Step 1: Start the local mock server

From the project root, run:

```bash
npm run lead:mock
```

You should see output similar to:

```text
[Mock Lead API] Listening on http://localhost:4010
[Mock Lead API] Expected auth header: Bearer local-test-key
```

Optional overrides:

```bash
MOCK_LEAD_API_PORT=4020 MOCK_LEAD_API_KEY=my-test-key npm run lead:mock
```

## Step 2: Check that the server is up

In your browser or Postman, open:

```text
http://localhost:4010/health
```

Expected response:

```json
{
  "ok": true,
  "service": "mock-capital-legacy-server",
  "port": 4010,
  "requests_received": 0
}
```

## Step 3: Create the Postman request

### Request settings

- Method: `POST`
- URL: `http://localhost:4010/leads`

### Headers

Add these headers:

- `Content-Type: application/json`
- `Authorization: Bearer local-test-key`

### Body

Choose:

- `Body`
- `raw`
- `JSON`

Paste this:

```json
{
  "client_age": 42,
  "employment_status": "employed",
  "has_minor_children": true,
  "has_property": true,
  "has_vehicle": true,
  "has_other_assets": true,
  "marital_status": "married",
  "client_address": "25 Protea Street, Johannesburg, Gauteng, 2191",
  "appointment_type": "spouse_partner"
}
```

## Step 4: Send the request

Click `Send`.

Expected success response:

```json
{
  "lead_id": "local-lead-<timestamp>",
  "status": "accepted"
}
```

## Step 5: Inspect what the server received

Open:

```text
http://localhost:4010/requests
```

This returns all accepted test requests so you can confirm exactly what Postman sent.

## Common errors and what they mean

### 401 Unauthorized

Your `Authorization` header is wrong or missing.

Use:

```text
Authorization: Bearer local-test-key
```

### 400 Validation failed

Your JSON body is missing a required field, has the wrong type, or includes unexpected fields.

This is useful because it helps you confirm that you are only sending the final agreed payload:

- `client_age`
- `employment_status`
- `has_minor_children`
- `has_property`
- `has_vehicle`
- `has_other_assets`
- `marital_status`
- `client_address`
- `appointment_type`

### 404 Not found

You are likely using the wrong path.

Use one of:

- `http://localhost:4010/leads`
- `http://localhost:4010/v1/leads`

## If you later want the app to hit the local server

Set your local env values to something like:

```bash
EXPO_PUBLIC_LEAD_API_URL=http://localhost:4010
EXPO_PUBLIC_LEAD_API_KEY=local-test-key
```

Notes:

- If you test from Postman on your Mac, `localhost` is correct.
- If you test from an iPhone or Android device, `localhost` will not point to your Mac. In that case use your Mac's local network IP address instead, for example `http://192.168.1.12:4010`.
