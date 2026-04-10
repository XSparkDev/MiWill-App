const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.MOCK_LEAD_API_PORT || 4010);
const AUTH_TOKEN = process.env.MOCK_LEAD_API_KEY || 'local-test-key';
const requests = [];

const allowedAppointmentTypes = new Set(['single', 'spouse_partner', 'family']);
const requiredFields = {
  client_age: 'number',
  employment_status: 'string',
  has_minor_children: 'boolean',
  has_property: 'boolean',
  has_vehicle: 'boolean',
  has_other_assets: 'boolean',
  marital_status: 'string',
  client_address: 'string',
  appointment_type: 'string',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function validateLeadPayload(payload) {
  const errors = [];
  const payloadKeys = Object.keys(payload || {});
  const expectedKeys = Object.keys(requiredFields);

  const unexpectedKeys = payloadKeys.filter((key) => !expectedKeys.includes(key));
  if (unexpectedKeys.length > 0) {
    errors.push(`Unexpected field(s): ${unexpectedKeys.join(', ')}`);
  }

  for (const [field, type] of Object.entries(requiredFields)) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    if (typeof payload[field] !== type) {
      errors.push(`Field ${field} must be ${type}, received ${typeof payload[field]}`);
      continue;
    }

    if (type === 'string' && payload[field].trim().length === 0) {
      errors.push(`Field ${field} cannot be empty`);
    }
  }

  if (
    typeof payload?.appointment_type === 'string' &&
    !allowedAppointmentTypes.has(payload.appointment_type)
  ) {
    errors.push(
      `appointment_type must be one of: ${Array.from(allowedAppointmentTypes).join(', ')}`
    );
  }

  if (typeof payload?.client_age === 'number' && payload.client_age < 0) {
    errors.push('client_age cannot be negative');
  }

  return errors;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const route = `${req.method} ${url.pathname}`;

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (route === 'GET /health') {
    sendJson(res, 200, {
      ok: true,
      service: 'mock-capital-legacy-server',
      port: PORT,
      requests_received: requests.length,
    });
    return;
  }

  if (route === 'GET /requests') {
    sendJson(res, 200, { requests });
    return;
  }

  if (route === 'POST /leads' || route === 'POST /v1/leads') {
    const authHeader = req.headers.authorization || '';
    const expectedAuth = `Bearer ${AUTH_TOKEN}`;

    if (authHeader !== expectedAuth) {
      sendJson(res, 401, {
        error: 'Unauthorized',
        message: 'Authorization header is missing or incorrect',
        expected: expectedAuth,
      });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const validationErrors = validateLeadPayload(payload);

      if (validationErrors.length > 0) {
        sendJson(res, 400, {
          error: 'Validation failed',
          message: 'Payload did not match the required local Capital Legacy contract',
          details: validationErrors,
        });
        return;
      }

      const leadId = `local-lead-${Date.now()}`;
      requests.push({
        lead_id: leadId,
        received_at: new Date().toISOString(),
        payload,
      });

      console.log('\n[Mock Lead API] Accepted lead');
      console.log(JSON.stringify({ lead_id: leadId, payload }, null, 2));

      sendJson(res, 201, {
        lead_id: leadId,
        status: 'accepted',
      });
    } catch (error) {
      sendJson(res, 400, {
        error: 'Invalid JSON',
        message: error.message || 'Could not parse request body',
      });
    }
    return;
  }

  sendJson(res, 404, {
    error: 'Not found',
    message: `No route for ${route}`,
    available_routes: [
      'GET /health',
      'GET /requests',
      'POST /leads',
      'POST /v1/leads',
    ],
  });
});

server.listen(PORT, () => {
  console.log(`[Mock Lead API] Listening on http://localhost:${PORT}`);
  console.log(`[Mock Lead API] Expected auth header: Bearer ${AUTH_TOKEN}`);
  console.log('[Mock Lead API] Routes: GET /health, GET /requests, POST /leads, POST /v1/leads');
});
