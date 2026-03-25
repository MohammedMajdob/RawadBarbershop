'use client';

import { useState, useRef, useEffect } from 'react';
import { sendOtp, verifyOtp, updateProfile, getProfile } from '@/lib/api';

interface LoginPromptProps {
  onAuthenticated: (token: string, profile: { id: string; name: string; phone: string }) => void;
  title?: string;
  subtitle?: string;
}

type LoginStep = 'phone' | 'otp' | 'name';

export default function LoginPrompt({ onAuthenticated, title, subtitle }: LoginPromptProps) {
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  // Store token temporarily between OTP verify and name step
  const [pendingToken, setPendingToken] = useState('');

  // OTP digits
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const toE164 = (p: string) => {
    if (p.startsWith('+')) return p;
    if (p.startsWith('0')) return `+972${p.slice(1)}`;
    return `+972${p}`;
  };

  // ─── Step 1: Send OTP ──────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^05\d{8}$/.test(phone)) {
      setPhoneError('מספר טלפון לא תקין (05XXXXXXXX)');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      const e164 = toE164(phone);
      setFormattedPhone(e164);
      await sendOtp(e164);
      setLoginStep('otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשליחת הקוד';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Auto focus OTP input
  useEffect(() => {
    if (loginStep === 'otp') {
      setTimeout(() => refs[0].current?.focus(), 100);
    }
  }, [loginStep]);

  // ─── Step 2: Verify OTP ────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) refs[index + 1].current?.focus();
    if (newDigits.every((d) => d) && value) handleVerifyOtp(newDigits.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs[index - 1].current?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setOtpError('');
    try {
      const result = await verifyOtp(formattedPhone, code);
      const accessToken = result.accessToken;

      if (result.isNewUser) {
        // New user → ask for name
        setPendingToken(accessToken);
        setLoginStep('name');
      } else {
        // Existing user → fetch profile and log in directly
        const profileData = await getProfile(accessToken);
        onAuthenticated(accessToken, profileData);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'קוד שגוי';
      setOtpError(message);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Set name (new users only) ─────────────────────────

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('נא להזין שם מלא');
      return;
    }
    setNameError('');
    setLoading(true);
    try {
      const updated = await updateProfile(pendingToken, name.trim());
      onAuthenticated(pendingToken, updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת השם';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // ─── Phone Step ────────────────────────────────────────────────

  if (loginStep === 'phone') {
    return (
      <div className="max-w-md mx-auto animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-foreground">{title || 'התחברות'}</h2>
          <p className="text-muted text-sm mt-2">{subtitle || 'הזן מספר טלפון כדי להתחבר'}</p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">מספר טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-0000000"
              dir="ltr"
              autoFocus
              className={`
                w-full px-4 py-3.5 rounded-xl border-2 text-left outline-none transition-all duration-200 bg-card text-foreground
                ${phoneError ? 'border-accent bg-red-50' : 'border-border focus:border-primary focus:shadow-sm'}
              `}
            />
            {phoneError && <p className="text-accent text-xs mt-1.5 font-medium">{phoneError}</p>}
          </div>

          <p className="text-muted text-xs text-center">נשלח קוד אימות חד פעמי לוואטסאפ שלך</p>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200
              ${loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                שולח קוד...
              </span>
            ) : (
              'שלח קוד אימות'
            )}
          </button>
        </form>
      </div>
    );
  }

  // ─── OTP Step ──────────────────────────────────────────────────

  if (loginStep === 'otp') {
    return (
      <div className="text-center max-w-sm mx-auto animate-fadeInUp space-y-8">
        <div>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">אימות מספר טלפון</h2>
          <p className="text-muted text-sm mt-2">הזן את הקוד בן 6 הספרות שנשלח לוואטסאפ שלך</p>
          <p className="text-muted text-xs mt-1" dir="ltr">{formattedPhone}</p>
        </div>

        <div className="flex justify-center gap-3" dir="ltr">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={refs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              disabled={loading}
              className={`
                w-14 h-16 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all duration-200 bg-card
                ${otpError
                  ? 'border-accent text-accent animate-shake'
                  : digit
                    ? 'border-primary text-primary shadow-sm'
                    : 'border-border focus:border-primary'
                }
              `}
            />
          ))}
        </div>

        {otpError && <p className="text-accent text-sm font-semibold">{otpError}</p>}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">מאמת...</span>
          </div>
        )}

        <p className="text-muted text-xs">הקוד תקף ל-5 דקות</p>

        <button
          onClick={() => {
            setLoginStep('phone');
            setDigits(['', '', '', '', '', '']);
            setOtpError('');
          }}
          className="text-primary text-sm font-semibold hover:underline"
        >
          שנה מספר טלפון
        </button>
      </div>
    );
  }

  // ─── Name Step (new users only) ────────────────────────────────

  return (
    <div className="max-w-md mx-auto animate-fadeInUp">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-foreground">המספר אומת!</h2>
        <p className="text-muted text-sm mt-2">נשאר רק להזין את השם שלך</p>
      </div>

      <form onSubmit={handleSetName} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">שם מלא</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הכנס שם מלא"
            autoFocus
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 text-right outline-none transition-all duration-200 bg-card text-foreground
              ${nameError ? 'border-accent bg-red-50' : 'border-border focus:border-primary focus:shadow-sm'}
            `}
          />
          {nameError && <p className="text-accent text-xs mt-1.5 font-medium">{nameError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200
            ${loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 active:scale-[0.98]'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              שומר...
            </span>
          ) : (
            'סיום הרשמה'
          )}
        </button>
      </form>
    </div>
  );
}
