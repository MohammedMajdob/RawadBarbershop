'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import HeroSlider from '@/components/ui/HeroSlider';
import Stepper from '@/components/ui/Stepper';
import BottomNav from '@/components/ui/BottomNav';
import DatePicker from '@/components/booking/DatePicker';
import TimePicker from '@/components/booking/TimePicker';
import DetailsForm from '@/components/booking/DetailsForm';
import OtpVerify from '@/components/booking/OtpVerify';
import Confirmation from '@/components/booking/Confirmation';
import MyBookings from '@/components/booking/MyBookings';
import ProfilePage from '@/components/booking/ProfilePage';
import LoginPrompt from '@/components/booking/LoginPrompt';
import { mutate } from 'swr';
import {
  startBooking,
  verifyBooking,
  getProfile,
  quickBook,
  rescheduleMyBooking,
  holdSlot,
  releaseHold,
} from '@/lib/api';
import { useHeroImages } from '@/lib/hooks';

interface CustomerProfile {
  id: string;
  name: string | null;
  phone: string;
}

type ActiveTab = 'booking' | 'myBookings' | 'profile';

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Hero images from DB (SWR cached)
  const { data: heroData, isLoading: heroLoading } = useHeroImages();
  const heroImages = Array.isArray(heroData) ? heroData : [];

  // Tab navigation - always visible
  const [activeTab, setActiveTab] = useState<ActiveTab>('booking');

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  // Hold state (slot lock)
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  // Release hold on page close/refresh
  useEffect(() => {
    const handleUnload = () => {
      const currentHoldId = holdId;
      if (currentHoldId) {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/booking/hold/${currentHoldId}/release`;
        navigator.sendBeacon(url);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [holdId]);

  // Release hold when switching away from booking tab
  useEffect(() => {
    if (activeTab !== 'booking' && holdId) {
      releaseHold(holdId).catch(() => {});
      setHoldId(null);
    }
  }, [activeTab, holdId]);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('customer_token');
    if (savedToken) {
      getProfile(savedToken)
        .then((p) => {
          setToken(savedToken);
          setProfile(p);
        })
        .catch(() => {
          localStorage.removeItem('customer_token');
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const isAuthenticated = !!token && !!profile;

  // ─── Auth handler (from LoginPrompt) ─────────────────────────

  const handleAuthenticated = (newToken: string, newProfile: { id: string; name: string; phone: string }) => {
    localStorage.setItem('customer_token', newToken);
    setToken(newToken);
    // Fetch full profile from server to get correct data
    getProfile(newToken).then((p) => setProfile(p)).catch(() => {
      setProfile({ id: newProfile.id, name: newProfile.name, phone: newProfile.phone });
    });
  };

  // ─── Booking handlers ────────────────────────────────────────

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Flow for NEW customers (OTP via booking)
  const handleDetailsSubmit = async (name: string, phone: string) => {
    setLoading(true);
    setCustomerName(name);
    try {
      const result = await startBooking({
        name,
        phone,
        date: selectedDate,
        time: selectedTime,
      });
      setBookingId(result.bookingId);
      setHoldId(null); // hold is consumed by the booking
      setStep(3);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (code: string) => {
    setLoading(true);
    setOtpError('');
    try {
      const result = await verifyBooking(bookingId, code);

      // Save token from first-time verification
      if (result.accessToken) {
        localStorage.setItem('customer_token', result.accessToken);
        setToken(result.accessToken);
        if (result.customer) {
          setProfile(result.customer);
        }
      }

      // Invalidate bookings cache so "my bookings" tab stays in sync
      mutate((key: unknown) => Array.isArray(key) && key[0] === '/booking/my');
      setStep(4);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'קוד שגוי';
      setOtpError(message);
    } finally {
      setLoading(false);
    }
  };

  // Flow for RETURNING customers (no OTP)
  const handleQuickBook = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (rescheduleId) {
        await rescheduleMyBooking(token, rescheduleId, {
          date: selectedDate,
          time: selectedTime,
        });
      } else {
        await quickBook(token, {
          date: selectedDate,
          time: selectedTime,
        });
      }
      setCustomerName(profile?.name || '');
      setRescheduleId(null);
      setHoldId(null);
      setStep(4);
      // Invalidate bookings cache so "my bookings" tab stays in sync
      mutate((key: unknown) => Array.isArray(key) && key[0] === '/booking/my');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת ההזמנה';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const doReleaseHold = async () => {
    if (holdId) {
      try { await releaseHold(holdId); } catch {}
      setHoldId(null);
      setHoldExpiresAt(null);
    }
  };

  const resetBooking = () => {
    doReleaseHold(); // fire-and-forget is fine here, hold expires anyway
    setHoldId(null);
    setHoldExpiresAt(null);
    setStep(0);
    setSelectedDate('');
    setSelectedTime('');
    setBookingId('');
    setCustomerName('');
    setOtpError('');
    setRescheduleId(null);
  };

  const handleNewBooking = () => {
    resetBooking();
    setActiveTab('booking');
  };

  const handleReschedule = (booking: { id: string }) => {
    resetBooking();
    setRescheduleId(booking.id);
    setActiveTab('booking');
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    setToken(null);
    setProfile(null);
    resetBooking();
    setActiveTab('booking');
  };

  // Step navigation
  const canGoNext =
    (step === 0 && selectedDate) ||
    (step === 1 && selectedTime);

  const [holdLoading, setHoldLoading] = useState(false);

  const goNext = async () => {
    if (step === 0 && selectedDate) {
      setStep(1);
    } else if (step === 1 && selectedTime) {
      // Hold the slot when advancing to confirmation
      setHoldLoading(true);
      try {
        const result = await holdSlot({ date: selectedDate, time: selectedTime });
        setHoldId(result.holdId);
        setHoldExpiresAt(result.expiresAt);
        setStep(2);
      } catch {
        setToast('לקוח אחר מזמין את השעה הזו כרגע, נסה שוב בעוד כמה דקות או בחר שעה אחרת');
        setSelectedTime('');
      } finally {
        setHoldLoading(false);
      }
    }
  };

  const goBack = async () => {
    if (step === 2) {
      await doReleaseHold();
    }
    if (step > 0 && step < 4) setStep(step - 1);
  };

  // Loading screen
  if (!authChecked) {
    return (
      <main className="flex-1 flex flex-col min-h-screen items-center justify-center">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // ─── Booking Flow Content ────────────────────────────────────

  const renderBookingFlow = () => (
    <>
      {/* Promotions Slider */}
      <div className="px-4 py-3 bg-white">
        <HeroSlider images={heroImages} loading={heroLoading} />
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} />

      {/* Reschedule banner */}
      {rescheduleId && step < 4 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={handleNewBooking}
              className="text-sm font-bold text-accent hover:underline"
            >
              בטל עדכון
            </button>
            <div className="flex items-center gap-2 text-right">
              <span className="text-sm font-bold text-amber-800">שינוי תור - בחר זמן חדש</span>
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {step === 0 && (
          <DatePicker
            onSelect={handleDateSelect}
            selectedDate={selectedDate}
            title={rescheduleId ? 'בחר תאריך חדש' : undefined}
          />
        )}

        {step === 1 && (
          <TimePicker
            date={selectedDate}
            onSelect={handleTimeSelect}
            selectedTime={selectedTime}
            title={rescheduleId ? 'בחר שעה חדשה' : undefined}
          />
        )}

        {step === 2 && isAuthenticated ? (
          <QuickConfirmStep
            name={profile.name || ''}
            phone={profile.phone}
            date={selectedDate}
            time={selectedTime}
            loading={loading}
            onConfirm={handleQuickBook}
            isReschedule={!!rescheduleId}
            holdExpiresAt={holdExpiresAt}
            onHoldExpired={resetBooking}
          />
        ) : step === 2 ? (
          <>
            {holdExpiresAt && <HoldCountdownBanner expiresAt={holdExpiresAt} onExpired={resetBooking} />}
            <DetailsForm
              date={selectedDate}
              time={selectedTime}
              onSubmit={handleDetailsSubmit}
              loading={loading}
            />
          </>
        ) : null}

        {step === 3 && (
          <OtpVerify
            onVerify={handleOtpVerify}
            loading={loading}
            error={otpError}
          />
        )}

        {step === 4 && (
          <Confirmation
            booking={{
              name: isAuthenticated ? (profile.name || '') : customerName,
              date: selectedDate,
              time: selectedTime,
            }}
            onNewBooking={handleNewBooking}
          />
        )}
      </div>

      {/* Step navigation buttons */}
      {step < 4 && (
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-3">
            {/* Continue button - only on steps 0-1 */}
            {step < 2 && (
              <button
                onClick={goNext}
                disabled={!canGoNext || holdLoading}
                className={`
                  flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
                  ${canGoNext && !holdLoading
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {holdLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    בודק זמינות...
                  </span>
                ) : (
                  <>
                    <span>המשך</span>
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}

            {/* Back button - on all steps except 0 */}
            {step > 0 && (
              <button
                onClick={goBack}
                className="flex-1 py-3.5 rounded-xl font-bold text-base border-2 border-border text-foreground flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>חזור</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  // ─── Main Layout - always has bottom nav ─────────────────────

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <Logo />

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fadeInUp">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-foreground text-sm mb-1">השעה תפוסה</p>
              <p className="text-muted text-sm leading-relaxed">{toast}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col pb-[70px]">
        {/* ── Booking Tab ─────────────────────────────────────── */}
        {activeTab === 'booking' && renderBookingFlow()}

        {/* ── My Bookings Tab ─────────────────────────────────── */}
        {activeTab === 'myBookings' && (
          <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
            {isAuthenticated ? (
              <MyBookings
                token={token}
                onReschedule={handleReschedule}
                onClose={handleNewBooking}
              />
            ) : (
              <LoginPrompt
                onAuthenticated={handleAuthenticated}
                title="התורים שלי"
                subtitle="התחבר כדי לראות ולנהל את התורים שלך"
              />
            )}
          </div>
        )}

        {/* ── Profile Tab ─────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
            {isAuthenticated ? (
              <ProfilePage
                token={token}
                profile={profile}
                onProfileUpdate={(p) => setProfile(p)}
                onLogout={handleLogout}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            ) : (
              <LoginPrompt
                onAuthenticated={handleAuthenticated}
                title="פרופיל"
                subtitle="התחבר כדי לנהל את הפרופיל שלך"
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation - ALWAYS visible */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

// ─── Quick Confirm Step (for authenticated users) ──────────────

// ─── Hold Countdown Banner ──────────────────────────────────────

function HoldCountdownBanner({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        clearInterval(timer);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isLow = secondsLeft <= 30;

  return (
    <div className={`rounded-xl p-3 mb-4 flex items-center justify-between border ${isLow ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className={`text-2xl font-black tabular-nums ${isLow ? 'text-red-600' : 'text-amber-700'}`} dir="ltr">
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isLow ? 'text-red-700' : 'text-amber-800'}`}>
          {isLow ? 'הזמן עומד לפוג!' : 'השעה שמורה לך'}
        </p>
        <p className={`text-xs ${isLow ? 'text-red-500' : 'text-amber-600'}`}>
          אשר את התור לפני שהזמן נגמר
        </p>
      </div>
    </div>
  );
}

interface QuickConfirmStepProps {
  name: string;
  phone: string;
  date: string;
  time: string;
  loading: boolean;
  onConfirm: () => void;
  isReschedule?: boolean;
  holdExpiresAt?: string | null;
  onHoldExpired?: () => void;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function QuickConfirmStep({ name, phone, date, time, loading, onConfirm, isReschedule, holdExpiresAt, onHoldExpired }: QuickConfirmStepProps) {
  // Parse as local date to avoid timezone shift (date is "YYYY-MM-DD")
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayName = dayNames[d.getDay()];

  return (
    <div className="space-y-5 max-w-md mx-auto animate-fadeInUp">
      {holdExpiresAt && onHoldExpired && (
        <HoldCountdownBanner expiresAt={holdExpiresAt} onExpired={onHoldExpired} />
      )}

      <h2 className="text-xl font-bold text-center text-foreground">
        {isReschedule ? 'עדכון תור' : 'אישור תור'}
      </h2>

      {/* Profile info */}
      <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="text-right flex-1">
          <p className="font-bold text-foreground">{name}</p>
          <p className="text-sm text-muted" dir="ltr">{phone}</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-card rounded-2xl p-5 border-2 border-border">
        <h3 className="font-bold text-foreground text-right mb-4">סיכום הזמנה</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">שירות</span>
            <span className="font-semibold text-foreground">תספורת</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">תאריך</span>
            <span className="font-semibold text-foreground">
              יום {dayName}, {d.getDate().toString().padStart(2, '0')}/{(d.getMonth() + 1).toString().padStart(2, '0')}/{d.getFullYear()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">שעה</span>
            <span className="font-semibold text-foreground">{time}</span>
          </div>
          <div className="border-t border-border my-2" />
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm font-semibold">מחיר</span>
            <span className="font-black text-primary text-lg">₪70</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-success font-medium">
        ללא צורך בקוד אימות - המספר שלך כבר מאומת
      </p>

      {/* Submit */}
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`
          w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200
          ${loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isReschedule ? 'מעדכן תור...' : 'קובע תור...'}
          </span>
        ) : (
          isReschedule ? 'עדכן תור' : 'אשר תור'
        )}
      </button>
    </div>
  );
}
