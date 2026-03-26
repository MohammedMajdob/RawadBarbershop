'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  adminLogin,
  getAdminBookings,
  cancelBooking,
  completeBooking,
  createManualBooking,
  getAvailableDates,
  getAvailableSlots,
  getAdminSettings,
  updateAdminSettings,
  getHeroImages,
  addHeroImage,
  toggleHeroImage,
  deleteHeroImage,
  uploadImage,
} from '@/lib/api';

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const allDays = [0, 1, 2, 3, 4, 5, 6];

interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: string;
  cancelledBy: string | null;
  rescheduledFromDate: string | null;
  rescheduledFromTime: string | null;
  createdAt: string;
}

interface TimeRange {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  ranges: TimeRange[];
}

type Schedule = Record<string, DaySchedule>;

interface Settings {
  businessName: string;
  phone: string;
  price: number;
  duration: number;
  advanceBookingDays: number;
  schedule: Schedule;
  blockedDates: string[];
}

interface HeroImage {
  id: string;
  url: string;
  title: string | null;
  order: number;
  active: boolean;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'hero'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [bookingView, setBookingView] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [confirmPopup, setConfirmPopup] = useState<{ type: 'complete' | 'cancel'; booking: Booking } | null>(null);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualSlots, setManualSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [manualTime, setManualTime] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualAvailDates, setManualAvailDates] = useState<string[]>([]);
  const [newHeroFile, setNewHeroFile] = useState<File | null>(null);
  const [newHeroTitle, setNewHeroTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await adminLogin(username, password);
      setToken(result.accessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setLoginError(msg);
    }
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBookings(token, selectedDate);
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getAdminSettings(token);
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const loadHeroImages = useCallback(async () => {
    try {
      const data = await getHeroImages(token, true);
      setHeroImages(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadBookings();
      loadSettings();
      loadHeroImages();
    }
  }, [token, loadBookings, loadSettings, loadHeroImages]);

  const handleConfirmAction = async () => {
    if (!confirmPopup) return;
    try {
      if (confirmPopup.type === 'cancel') {
        await cancelBooking(token, confirmPopup.booking.id);
      } else {
        await completeBooking(token, confirmPopup.booking.id);
      }
      loadBookings();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmPopup(null);
    }
  };

  const openManualBooking = async () => {
    setShowManualBooking(true);
    setManualDate('');
    setManualTime('');
    setManualName('');
    setManualPhone('');
    setManualSlots([]);
    try {
      const dates = await getAvailableDates();
      setManualAvailDates(dates);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualDateChange = async (date: string) => {
    setManualDate(date);
    setManualTime('');
    try {
      const data = await getAvailableSlots(date);
      setManualSlots(data.slots || []);
    } catch (e) {
      console.error(e);
      setManualSlots([]);
    }
  };

  const handleCreateManualBooking = async () => {
    if (!manualDate || !manualTime || !manualName || !manualPhone) return;
    setManualLoading(true);
    try {
      await createManualBooking(token, {
        date: manualDate,
        time: manualTime,
        name: manualName,
        phone: manualPhone,
      });
      setShowManualBooking(false);
      setSelectedDate(manualDate);
      loadBookings();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'שגיאה';
      alert(msg);
    } finally {
      setManualLoading(false);
    }
  };

  const handleToggleDay = async (day: number) => {
    if (!settings) return;
    const schedule = { ...settings.schedule };
    const dayKey = String(day);
    schedule[dayKey] = {
      ...schedule[dayKey],
      isOpen: !schedule[dayKey]?.isOpen,
      ranges: schedule[dayKey]?.ranges?.length ? schedule[dayKey].ranges : [{ start: '09:00', end: '17:00' }],
    };
    try {
      const updated = await updateAdminSettings(token, { schedule });
      setSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRange = async (day: number, rangeIndex: number, field: 'start' | 'end', value: string) => {
    if (!settings) return;
    const schedule = { ...settings.schedule };
    const dayKey = String(day);
    const ranges = [...(schedule[dayKey]?.ranges || [])];
    ranges[rangeIndex] = { ...ranges[rangeIndex], [field]: value };
    schedule[dayKey] = { ...schedule[dayKey], ranges };
    try {
      const updated = await updateAdminSettings(token, { schedule });
      setSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRange = async (day: number) => {
    if (!settings) return;
    const schedule = { ...settings.schedule };
    const dayKey = String(day);
    const ranges = [...(schedule[dayKey]?.ranges || [])];
    ranges.push({ start: '09:00', end: '17:00' });
    schedule[dayKey] = { ...schedule[dayKey], ranges };
    try {
      const updated = await updateAdminSettings(token, { schedule });
      setSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveRange = async (day: number, rangeIndex: number) => {
    if (!settings) return;
    const schedule = { ...settings.schedule };
    const dayKey = String(day);
    const ranges = [...(schedule[dayKey]?.ranges || [])];
    ranges.splice(rangeIndex, 1);
    schedule[dayKey] = { ...schedule[dayKey], ranges };
    try {
      const updated = await updateAdminSettings(token, { schedule });
      setSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!settings || !newBlockedDate) return;
    const updated = await updateAdminSettings(token, {
      blockedDates: [...settings.blockedDates, newBlockedDate],
    });
    setSettings(updated);
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = async (date: string) => {
    if (!settings) return;
    const updated = await updateAdminSettings(token, {
      blockedDates: settings.blockedDates.filter((d) => d !== date),
    });
    setSettings(updated);
  };

  const handleUpdateGeneralSettings = async (field: string, value: string | number) => {
    try {
      const updated = await updateAdminSettings(token, { [field]: value });
      setSettings(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddHeroImage = async () => {
    if (!newHeroFile) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(token, newHeroFile);
      await addHeroImage(token, url, newHeroTitle || undefined);
      setNewHeroFile(null);
      setNewHeroTitle('');
      loadHeroImages();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'שגיאה בהעלאת תמונה';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleHeroImage = async (id: string) => {
    try {
      await toggleHeroImage(token, id);
      loadHeroImages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHeroImage = async (id: string) => {
    if (!confirm('למחוק תמונה זו?')) return;
    try {
      await deleteHeroImage(token, id);
      loadHeroImages();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBookings = bookings
    .filter((b) => {
      if (bookingView === 'active') return b.status === 'CONFIRMED';
      if (bookingView === 'completed') return b.status === 'COMPLETED';
      if (bookingView === 'cancelled') return b.status === 'CANCELLED';
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const formatDateHebrew = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = dayNames[date.getDay()];
    return `יום ${dayName}, ${d}/${m}/${y}`;
  };

  // Login
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 w-full max-w-sm animate-scaleIn">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-foreground">ניהול המספרה</h1>
            <p className="text-muted text-sm mt-1">הזן את פרטי ההתחברות</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="שם משתמש"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-border outline-none focus:border-primary text-right bg-card transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-border outline-none focus:border-primary text-right bg-card transition-colors"
            />
            {loginError && (
              <p className="text-accent text-sm text-center font-medium">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              התחבר
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">לוח ניהול</h1>
              <p className="text-xs text-muted">Gentlemen Barber Shop</p>
            </div>
          </div>
          <button
            onClick={() => setToken('')}
            className="text-sm text-muted hover:text-accent font-medium transition-colors"
          >
            התנתק
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6 overflow-x-auto">
          {(['bookings', 'settings', 'hero'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab === 'bookings' ? 'תורים' : tab === 'settings' ? 'הגדרות' : 'תמונות'}
            </button>
          ))}
        </div>

        {/* ── Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 animate-fadeInUp pb-8">
            {/* Date picker + title */}
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold text-foreground">{formatDateHebrew(selectedDate)}</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                  />
                  <button
                    onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA'))}
                    className="px-3 py-2 text-xs text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors"
                  >
                    היום
                  </button>
                  <button
                    onClick={loadBookings}
                    className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors"
                  >
                    רענן
                  </button>
                </div>
              </div>
            </div>

            {/* View toggle + add button */}
            <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
              {([
                { key: 'active' as const, label: 'תורים פעילים' },
                { key: 'completed' as const, label: 'הושלמו' },
                { key: 'cancelled' as const, label: 'בוטלו' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setBookingView(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    bookingView === key
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={openManualBooking}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
            >
              + הוסף תור
            </button>
            </div>

            {/* Bookings list */}
            {loading ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <p>{bookingView === 'active' ? 'אין תורים פעילים ליום זה' : bookingView === 'completed' ? 'אין תורים שהושלמו ליום זה' : 'אין תורים שבוטלו ליום זה'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-card rounded-xl p-4 border border-border transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-black text-primary">{booking.time}</span>
                          <span className="font-bold text-foreground">{booking.name}</span>
                        </div>
                        <p className="text-sm text-muted mt-1">{booking.phone}</p>

                        {/* Reschedule info */}
                        {booking.rescheduledFromTime && (
                          <p className="text-xs text-orange-500 mt-1 font-medium">
                            שונה מ-{booking.rescheduledFromTime}
                            {booking.rescheduledFromDate && booking.rescheduledFromDate !== booking.date
                              ? ` (${booking.rescheduledFromDate})`
                              : ''}
                          </p>
                        )}

                        {/* Cancelled by info */}
                        {booking.status === 'CANCELLED' && booking.cancelledBy && (
                          <p className="text-xs text-red-400 mt-1 font-medium">
                            בוטל ע״י {booking.cancelledBy === 'customer' ? 'הלקוח' : 'הספר'}
                          </p>
                        )}
                      </div>

                      {/* Actions only for active bookings */}
                      {bookingView === 'active' && (
                        <div className="flex gap-2 mr-3">
                          <button
                            onClick={() => setConfirmPopup({ type: 'complete', booking })}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                          >
                            הושלם
                          </button>
                          <button
                            onClick={() => setConfirmPopup({ type: 'cancel', booking })}
                            className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors"
                          >
                            ביטול
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Confirm Popup ── */}
        {confirmPopup && (
          <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center px-4" onClick={() => setConfirmPopup(null)}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground text-center mb-2">
                {confirmPopup.type === 'complete' ? 'סימון כהושלם' : 'ביטול תור'}
              </h3>
              <p className="text-sm text-muted text-center mb-1">
                {confirmPopup.booking.name} - {confirmPopup.booking.time}
              </p>
              <p className="text-sm text-muted text-center mb-6">
                {confirmPopup.type === 'complete'
                  ? 'האם לסמן את התור כהושלם?'
                  : 'האם לבטל את התור? הלקוח לא יראה אותו יותר.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmPopup(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-muted font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  חזרה
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-colors ${
                    confirmPopup.type === 'complete'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {confirmPopup.type === 'complete' ? 'הושלם' : 'בטל תור'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Manual Booking Modal ── */}
        {showManualBooking && (
          <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center px-4" onClick={() => setShowManualBooking(false)}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border animate-scaleIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground text-center mb-4">הוספת תור ידני</h3>

              {/* Date selection */}
              <div className="mb-4">
                <label className="text-xs text-muted block mb-1.5 font-medium">בחר תאריך</label>
                <div className="flex flex-wrap gap-2">
                  {manualAvailDates.map((d) => {
                    const [y, m, day] = d.split('-').map(Number);
                    const date = new Date(y, m - 1, day);
                    const dayName = dayNames[date.getDay()];
                    return (
                      <button
                        key={d}
                        onClick={() => handleManualDateChange(d)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          manualDate === d
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted hover:border-primary/50'
                        }`}
                      >
                        <span className="block text-xs">{dayName}</span>
                        <span>{day}/{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection */}
              {manualDate && (
                <div className="mb-4">
                  <label className="text-xs text-muted block mb-1.5 font-medium">בחר שעה</label>
                  {manualSlots.length === 0 ? (
                    <p className="text-sm text-muted">אין שעות פנויות ליום זה</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {manualSlots.filter((s) => s.available).map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setManualTime(slot.time)}
                          className={`px-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            manualTime === slot.time
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:border-primary/50'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Name & Phone */}
              {manualTime && (
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-xs text-muted block mb-1.5 font-medium">שם הלקוח</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="שם מלא"
                      className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors text-right"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1.5 font-medium">מספר טלפון</label>
                    <input
                      type="tel"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="050-1234567"
                      className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualBooking(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-muted font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleCreateManualBooking}
                  disabled={!manualDate || !manualTime || !manualName || !manualPhone || manualLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40"
                >
                  {manualLoading ? 'יוצר...' : 'צור תור'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-5 animate-fadeInUp pb-8">
            {/* General Settings */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-1">הגדרות כלליות</h3>
              <p className="text-xs text-muted mb-4">פרטי העסק שמוצגים ללקוחות</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted block mb-1.5 font-medium">שם העסק</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    onBlur={(e) => handleUpdateGeneralSettings('businessName', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors text-right"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1.5 font-medium">טלפון</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    onBlur={(e) => handleUpdateGeneralSettings('phone', e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1.5 font-medium">מחיר תספורת (₪)</label>
                    <input
                      type="number"
                      value={settings.price}
                      onChange={(e) => setSettings({ ...settings, price: Number(e.target.value) })}
                      onBlur={(e) => handleUpdateGeneralSettings('price', Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1.5 font-medium">משך תור (דקות)</label>
                    <input
                      type="number"
                      value={settings.duration}
                      onChange={(e) => setSettings({ ...settings, duration: Number(e.target.value) })}
                      onBlur={(e) => handleUpdateGeneralSettings('duration', Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 1. Per-Day Schedule ── */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-1">לוח זמנים שבועי</h3>
              <p className="text-xs text-muted mb-4">לחץ על יום כדי לפתוח/לסגור. לכל יום ניתן להגדיר שעות שונות ולפצל משמרות.</p>

              <div className="space-y-3">
                {allDays.map((day) => {
                  const dayKey = String(day);
                  const daySchedule = settings.schedule?.[dayKey];
                  const isOpen = daySchedule?.isOpen ?? false;
                  const ranges = daySchedule?.ranges ?? [];

                  return (
                    <div key={day} className={`rounded-xl border-2 transition-all ${isOpen ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                      {/* Day header */}
                      <button
                        onClick={() => handleToggleDay(day)}
                        className="w-full flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`font-bold text-sm ${isOpen ? 'text-green-700' : 'text-gray-400'}`}>
                            {dayNames[day]}
                          </span>
                        </div>
                        <span className={`text-xs font-semibold ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                          {isOpen ? 'פתוח' : 'סגור'}
                        </span>
                      </button>

                      {/* Time ranges (only if open) */}
                      {isOpen && (
                        <div className="px-4 pb-3 space-y-2">
                          {ranges.map((range, ri) => (
                            <div key={ri} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={range.start}
                                onChange={(e) => handleUpdateRange(day, ri, 'start', e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-semibold text-center w-28"
                              />
                              <span className="text-gray-400 text-sm">עד</span>
                              <input
                                type="time"
                                value={range.end}
                                onChange={(e) => handleUpdateRange(day, ri, 'end', e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-semibold text-center w-28"
                              />
                              {ranges.length > 1 && (
                                <button
                                  onClick={() => handleRemoveRange(day, ri)}
                                  className="text-red-400 hover:text-red-600 text-lg font-bold leading-none"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddRange(day)}
                            className="text-xs text-primary font-semibold hover:text-primary-dark transition-colors"
                          >
                            + הוסף משמרת
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Advance Booking Days ── */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-1">כמה ימים קדימה ניתן לקבוע?</h3>
              <p className="text-xs text-muted mb-4">הלקוחות יוכלו לקבוע תור רק עד מספר הימים הזה מהיום</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.advanceBookingDays}
                  onChange={(e) => setSettings({ ...settings, advanceBookingDays: Number(e.target.value) })}
                  onBlur={(e) => handleUpdateGeneralSettings('advanceBookingDays', Number(e.target.value))}
                  className="w-24 px-4 py-3 border-2 border-border rounded-xl outline-none focus:border-primary text-base bg-card transition-colors font-semibold text-center"
                />
                <span className="text-sm text-muted font-medium">ימים</span>
              </div>
            </div>

            {/* ── 3. Blocked Dates ── */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-1">חסימת תאריכים</h3>
              <p className="text-xs text-muted mb-4">ימים חסומים לא יוצגו ללקוחות ולא ניתן לקבוע בהם תור</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors"
                />
                <button
                  onClick={handleAddBlockedDate}
                  disabled={!newBlockedDate}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  + הוסף תאריך
                </button>
              </div>

              {settings.blockedDates.length === 0 ? (
                <p className="text-muted text-sm py-3 text-center">אין תאריכים חסומים כרגע</p>
              ) : (
                <div className="space-y-2">
                  {settings.blockedDates.map((date) => (
                    <div
                      key={date}
                      className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">{date}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveBlockedDate(date)}
                        className="text-xs bg-white text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors border border-red-200"
                      >
                        הסר
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hero Images Tab ── */}
        {activeTab === 'hero' && (
          <div className="space-y-5 animate-fadeInUp pb-8">
            {/* Add new */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-4">הוספת תמונה</h3>
              <div className="space-y-3">
                <label className="block w-full cursor-pointer">
                  <div className="w-full px-3 py-4 border-2 border-dashed border-border rounded-xl text-center text-sm text-muted hover:border-primary transition-colors">
                    {newHeroFile ? newHeroFile.name : 'לחץ לבחירת תמונה'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setNewHeroFile(e.target.files?.[0] || null)}
                  />
                </label>
                <input
                  type="text"
                  value={newHeroTitle}
                  onChange={(e) => setNewHeroTitle(e.target.value)}
                  placeholder="כותרת (אופציונלי)"
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl outline-none focus:border-primary text-sm bg-card transition-colors text-right"
                />
                <button
                  onClick={handleAddHeroImage}
                  disabled={!newHeroFile || uploading}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-40"
                >
                  {uploading ? 'מעלה...' : 'הוסף תמונה'}
                </button>
              </div>
            </div>

            {/* Image list */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-foreground mb-4">תמונות ({heroImages.length})</h3>
              {heroImages.length === 0 ? (
                <p className="text-muted text-sm">אין תמונות</p>
              ) : (
                <div className="space-y-3">
                  {heroImages.map((img) => (
                    <div
                      key={img.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-border ${!img.active ? 'opacity-50' : ''}`}
                    >
                      <img
                        src={img.url}
                        alt={img.title || ''}
                        className="w-20 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{img.title || 'ללא כותרת'}</p>
                        <p className="text-xs text-muted truncate" dir="ltr">{img.url}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleHeroImage(img.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                            img.active
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {img.active ? 'פעיל' : 'כבוי'}
                        </button>
                        <button
                          onClick={() => handleDeleteHeroImage(img.id)}
                          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
