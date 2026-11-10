/**
 * ParkWise AI - REST API Client Service
 * Connects React frontend components to the Python Flask backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

/**
 * Normalizes backend SQLite snake_case fields with frontend camelCase properties
 * so all components can access fields consistently without breaking changes.
 */
export function normalizeViolation(v) {
  if (!v) return null;
  const fine = parseFloat(v.fine_amount ?? v.fineAmount ?? 0);
  const late = parseFloat(v.late_fee ?? v.lateFee ?? 0);
  return {
    ...v,
    id: v.id,
    vehicle_plate: v.vehicle_plate || v.vehiclePlate,
    vehiclePlate: v.vehicle_plate || v.vehiclePlate,
    vehicle_details: v.vehicle_details || v.vehicleDetails || `Registered Vehicle (${v.vehicle_plate || v.vehiclePlate})`,
    vehicleDetails: v.vehicle_details || v.vehicleDetails || `Registered Vehicle (${v.vehicle_plate || v.vehiclePlate})`,
    driver_name: v.driver_name || v.driverName || 'Amanpreet Singh',
    driverName: v.driver_name || v.driverName || 'Amanpreet Singh',
    type: v.type,
    category: v.category || 'General Curbside Parking',
    location: v.location,
    gps: v.gps,
    issue_date: v.issue_date || v.issueDate,
    issueDate: v.issue_date || v.issueDate,
    due_date: v.due_date || v.dueDate,
    dueDate: v.due_date || v.dueDate,
    fine_amount: fine,
    fineAmount: fine,
    late_fee: late,
    lateFee: late,
    total_due: fine + late,
    totalDue: fine + late,
    status: v.status,
    ordinance_code: v.ordinance_code || v.ordinanceCode,
    ordinanceCode: v.ordinance_code || v.ordinanceCode,
    evidence_image: v.evidence_image || v.evidenceImage,
    evidenceImage: v.evidence_image || v.evidenceImage,
    description: v.description,
    ai_assessment: v.ai_assessment || v.aiAssessment,
    aiAssessment: v.ai_assessment || v.aiAssessment,
    dispute_details: v.dispute_details || v.disputeDetails,
    disputeDetails: v.dispute_details || v.disputeDetails,
    resolved_at: v.resolved_at || v.resolvedAt,
    resolvedAt: v.resolved_at || v.resolvedAt,
    resolution_method: v.resolution_method || v.resolutionMethod,
    resolutionMethod: v.resolution_method || v.resolutionMethod
  };
}

/**
 * Fetch system health and database diagnostic status
 */
export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch municipal admin overview KPIs and financial stats
 */
export async function getAdminOverview() {
  const response = await fetch(`${API_BASE}/admin/overview`);
  if (!response.ok) {
    throw new Error(`Failed to load admin overview (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch violations list with optional filters (plate, status, category, user_id)
 */
export async function getViolations(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });

  const url = query.toString() ? `${API_BASE}/violations?${query.toString()}` : `${API_BASE}/violations`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch violations (Status: ${response.status})`);
  }
  const data = await response.json();
  if (data.violations && Array.isArray(data.violations)) {
    data.violations = data.violations.map(normalizeViolation);
  }
  return data;
}

/**
 * Fetch single violation by ID
 */
export async function getViolationById(violationId) {
  const response = await fetch(`${API_BASE}/violations/${encodeURIComponent(violationId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch violation ${violationId} (Status: ${response.status})`);
  }
  const data = await response.json();
  if (data.violation) {
    data.violation = normalizeViolation(data.violation);
  }
  return data;
}

/**
 * Submit a dispute for a citation to Flask SQLite backend
 */
export async function submitDisputeApi({ violationId, reason, letterText = '', evidenceSubmitted = true, userId = null }) {
  const response = await fetch(`${API_BASE}/disputes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      violation_id: violationId,
      reason,
      letter_text: letterText,
      evidence_submitted: Boolean(evidenceSubmitted),
      user_id: userId
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Dispute submission failed (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch disputes from Flask SQLite backend with optional filters
 */
export async function getDisputes(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });

  const url = query.toString() ? `${API_BASE}/disputes?${query.toString()}` : `${API_BASE}/disputes`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch disputes (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Update dispute status (e.g. adjudicator approval or rejection)
 */
export async function updateDisputeStatusApi(disputeId, { status, adjudicatorNotes = '', waiveFine = true }) {
  const response = await fetch(`${API_BASE}/disputes/${encodeURIComponent(disputeId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      adjudicator_notes: adjudicatorNotes,
      waive_fine: Boolean(waiveFine)
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Dispute adjudication update failed (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Update violation status (e.g. mark Resolved upon demonstration payment)
 */
export async function updateViolationStatusApi(violationId, { status, resolutionMethod = null }) {
  const response = await fetch(`${API_BASE}/violations/${encodeURIComponent(violationId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      resolution_method: resolutionMethod
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Status update failed (Status: ${response.status})`);
  }
  const data = await response.json();
  if (data.violation) {
    data.violation = normalizeViolation(data.violation);
  }
  return data;
}

/**
 * Fetch single driver profile, registered vehicles, and balance
 */
export async function getDriverById(driverId = 'usr_ind_001') {
  const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(driverId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch driver profile (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch municipal rules
 */
export async function getRules(activeOnly = false) {
  const url = activeOnly ? `${API_BASE}/rules?active_only=true` : `${API_BASE}/rules`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch parking rules (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch registered drivers
 */
export async function getDrivers(search = '') {
  const url = search ? `${API_BASE}/drivers?search=${encodeURIComponent(search)}` : `${API_BASE}/drivers`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch drivers (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch citizen community violation reports
 */
export async function getReports() {
  const response = await fetch(`${API_BASE}/reports`);
  if (!response.ok) {
    throw new Error(`Failed to fetch community reports (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Submit citizen community violation report to Flask SQLite backend
 */
export async function submitReportApi({ vehiclePlate, location, violationType, reportedBy = 'Citizen Reporter', photoUrl = null, notes = '', confidence = '92% confidence (Simulated)' }) {
  const response = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicle_plate: vehiclePlate,
      location,
      violation_type: violationType,
      reported_by: reportedBy,
      photo_url: photoUrl,
      notes,
      confidence
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to submit report (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Check AI copilot status and backend Gemini configuration
 */
export async function getAiStatus() {
  const response = await fetch(`${API_BASE}/ai/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch AI status (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * Send inquiry to Flask backend Gemini AI chat endpoint with RAG context
 */
export async function sendAiChatMessage({ message, history = [] }) {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `AI inquiry failed (Status: ${response.status})`);
  }
  return response.json();
}


