const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-1b38.up.railway.app/api';

async function fetchApi(endpoint: string, options?: RequestInit) {
  const { headers, ...rest } = options || {};

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  } catch {
    throw new Error('שגיאת רשת - בדוק את החיבור');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`שגיאת שרת (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.message || 'שגיאה בשרת');
  }

  return data;
}

// Availability
export async function getAvailableDates() {
  return fetchApi('/availability/dates');
}

export async function getAvailableSlots(date: string) {
  return fetchApi(`/availability?date=${date}`);
}

// Public hero images
export async function getPublicHeroImages() {
  return fetchApi('/availability/hero');
}

// Slot hold
export async function holdSlot(data: { date: string; time: string }) {
  return fetchApi('/booking/hold', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function releaseHold(holdId: string) {
  return fetchApi(`/booking/hold/${holdId}`, {
    method: 'DELETE',
  });
}

// Booking
export async function startBooking(data: {
  name: string;
  phone: string;
  date: string;
  time: string;
}) {
  return fetchApi('/booking/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyBooking(bookingId: string, otpCode: string) {
  return fetchApi('/booking/verify', {
    method: 'POST',
    body: JSON.stringify({ bookingId, otpCode }),
  });
}

// ─── Customer Auth ─────────────────────────────────────────────

export async function sendOtp(phone: string) {
  return fetchApi('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  return fetchApi('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

function customerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getProfile(token: string) {
  return fetchApi('/auth/me', {
    headers: customerHeaders(token),
  });
}

export async function updateProfile(token: string, name: string) {
  return fetchApi('/auth/me', {
    method: 'PATCH',
    headers: customerHeaders(token),
    body: JSON.stringify({ name }),
  });
}

export async function deleteProfile(token: string) {
  return fetchApi('/auth/me', {
    method: 'DELETE',
    headers: customerHeaders(token),
  });
}

// ─── Customer Bookings ─────────────────────────────────────────

export async function quickBook(token: string, data: { date: string; time: string }) {
  return fetchApi('/booking/quick', {
    method: 'POST',
    headers: customerHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getMyBookings(token: string) {
  return fetchApi('/booking/my', {
    headers: customerHeaders(token),
  });
}

export async function cancelMyBooking(token: string, bookingId: string) {
  return fetchApi(`/booking/my/${bookingId}`, {
    method: 'DELETE',
    headers: customerHeaders(token),
  });
}

export async function rescheduleMyBooking(
  token: string,
  bookingId: string,
  data: { date: string; time: string },
) {
  return fetchApi(`/booking/my/${bookingId}/reschedule`, {
    method: 'PATCH',
    headers: customerHeaders(token),
    body: JSON.stringify(data),
  });
}

// ─── Admin Auth ────────────────────────────────────────────────

export async function adminLogin(username: string, password: string) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Admin (requires token)
function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Dashboard
export async function getDashboardStats(token: string) {
  return fetchApi('/admin/dashboard', {
    headers: authHeaders(token),
  });
}

// Bookings
export async function getAdminBookings(token: string, date?: string, status?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi(`/admin/bookings${query}`, {
    headers: authHeaders(token),
  });
}

export async function cancelBooking(token: string, id: string) {
  return fetchApi(`/admin/bookings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function completeBooking(token: string, id: string) {
  return fetchApi(`/admin/bookings/${id}/complete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

// Settings
export async function getAdminSettings(token: string) {
  return fetchApi('/admin/settings', {
    headers: authHeaders(token),
  });
}

export async function updateAdminSettings(
  token: string,
  data: Record<string, unknown>,
) {
  return fetchApi('/admin/settings', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// Upload
export async function uploadImage(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('שגיאת רשת - נסה שוב');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`שגיאת שרת (${res.status})`);
  }

  if (!res.ok) throw new Error(data.message || 'שגיאה בהעלאת תמונה');
  return data;
}

// Hero Images
export async function getHeroImages(token: string, includeAll = false) {
  const query = includeAll ? '?all=true' : '';
  return fetchApi(`/admin/hero${query}`, {
    headers: authHeaders(token),
  });
}

export async function addHeroImage(token: string, url: string, title?: string) {
  return fetchApi('/admin/hero', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url, title }),
  });
}

export async function toggleHeroImage(token: string, id: string) {
  return fetchApi(`/admin/hero/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

export async function reorderHeroImages(token: string, ids: string[]) {
  return fetchApi('/admin/hero/reorder', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ ids }),
  });
}

export async function deleteHeroImage(token: string, id: string) {
  return fetchApi(`/admin/hero/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
