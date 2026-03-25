'use client';

import { useState, useRef, useEffect } from 'react';

interface OtpVerifyProps {
  onVerify: (code: string) => void;
  loading?: boolean;
  error?: string;
}

export default function OtpVerify({ onVerify, loading, error }: OtpVerifyProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      refs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d) && value) {
      onVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      onVerify(pasted);
    }
  };

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
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className={`
              w-14 h-16 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all duration-200 bg-card
              ${error
                ? 'border-accent text-accent animate-shake'
                : digit
                  ? 'border-primary text-primary shadow-sm'
                  : 'border-border focus:border-primary'
              }
            `}
          />
        ))}
      </div>

      {error && (
        <p className="text-accent text-sm font-semibold">{error}</p>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">מאמת...</span>
        </div>
      )}

      <p className="text-muted text-xs">הקוד תקף ל-5 דקות</p>
    </div>
  );
}
