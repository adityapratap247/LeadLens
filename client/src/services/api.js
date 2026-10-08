const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchIcp() {
  const res = await fetch(`${API_BASE}/icp`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch ICP');
  return data.data;
}

export async function updateIcpApi(icpData) {
  const res = await fetch(`${API_BASE}/icp`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(icpData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update ICP');
  return data.data;
}

export async function resetWeightsApi() {
  const res = await fetch(`${API_BASE}/icp/reset-weights`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset weights');
  return data.data;
}

export async function fetchLeads(filters = {}) {
  const params = new URLSearchParams();
  if (filters.scoreMin !== undefined) params.append('scoreMin', filters.scoreMin);
  if (filters.scoreMax !== undefined) params.append('scoreMax', filters.scoreMax);
  if (filters.confidence && filters.confidence !== 'all') params.append('confidence', filters.confidence);
  if (filters.region && filters.region !== 'all') params.append('region', filters.region);
  if (filters.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
  return {
    leads: data.data,
    totalCount: data.totalCount,
    filteredCount: data.filteredCount,
  };
}

export async function loadSampleDataApi() {
  const res = await fetch(`${API_BASE}/leads/sample`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load sample data');
  return data;
}

export async function uploadCsvApi(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/leads/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload CSV');
  return data;
}

export async function pasteDomainsApi(domains) {
  const res = await fetch(`${API_BASE}/leads/paste-domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to scrape domains');
  return data;
}

export async function voteLeadApi(leadId, vote) {
  const res = await fetch(`${API_BASE}/leads/${leadId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record vote');
  return data.data;
}

export async function clearLeadsApi() {
  const res = await fetch(`${API_BASE}/leads/clear`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to clear leads');
  return data;
}

export function getExportCsvUrl() {
  return `${API_BASE}/leads/export-csv`;
}

