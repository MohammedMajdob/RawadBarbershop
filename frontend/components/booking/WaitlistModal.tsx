'use client';

import { useState } from 'react';
import { joinWaitlist } from '@/lib/api';

interface WaitlistModalProps {
  onClose: () => void;
  prefillName?: string;
  prefillPhone?: string;
  prefillDate?: string;
}

export default function WaitlistModal({ onClose, prefillName = '', prefillPhone = '', prefillDate = '' }: WaitlistModalProps) {
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [preferredDate, setPreferredDate] = useState(prefillDate);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('נא למלא שם ומספר טלפון');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinWaitlist({ name: name.trim(), phone: phone.trim(), preferredDate: preferredDate || undefined, note: note.trim() || undefined });
      setDone(true);
    } catch {
      setError('שגיאה, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">נרשמת בהצלחה!</h3>
            <p className="text-sm text-gray-500 mb-6">ניצור איתך קשר כשיתפנה תור</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-white font-bold">
              סגור
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 text-right mb-1">רשימת המתנה</h3>
            <p className="text-sm text-gray-500 text-right mb-5">נתקשר אליך כשיתפנה תור</p>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא *"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-right bg-gray-50 transition-colors"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="מספר טלפון *"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-left bg-gray-50 transition-colors"
              />
              <div className="relative">
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none bg-gray-50 text-right transition-colors"
                />
                {!preferredDate && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                    יום מועדף (אופציונלי)
                  </span>
                )}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="הערה (אופציונלי) — למשל: רק בוקר, רק אחה״צ..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-right bg-gray-50 resize-none transition-colors text-sm"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-right mt-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-primary text-white font-bold text-base disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? 'שולח...' : 'הצטרף לרשימה'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
