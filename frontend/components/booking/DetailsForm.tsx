'use client';

import { useState } from 'react';

interface DetailsFormProps {
  date: string;
  time: string;
  onSubmit: (name: string, phone: string) => void;
  loading?: boolean;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function DetailsForm({ date, time, onSubmit, loading }: DetailsFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Parse as local date to avoid timezone shift
  const [yr, mo, dy] = date.split('-').map(Number);
  const d = new Date(yr, mo - 1, dy);
  const dayName = dayNames[d.getDay()];

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'נא להזין שם מלא';
    if (!/^05\d{8}$/.test(phone)) newErrors.phone = 'מספר טלפון לא תקין (05XXXXXXXX)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(name.trim(), phone);
    }
  };

  return (
    <div className="space-y-5 max-w-md mx-auto animate-fadeInUp">
      <h2 className="text-xl font-bold text-center text-foreground">פרטים אישיים</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">שם מלא</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הכנס שם מלא"
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 text-right outline-none transition-all duration-200 bg-card text-foreground
              ${errors.name ? 'border-accent bg-red-50' : 'border-border focus:border-primary focus:shadow-sm'}
            `}
          />
          {errors.name && <p className="text-accent text-xs mt-1.5 font-medium">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">מספר טלפון</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-0000000"
            dir="ltr"
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 text-left outline-none transition-all duration-200 bg-card text-foreground
              ${errors.phone ? 'border-accent bg-red-50' : 'border-border focus:border-primary focus:shadow-sm'}
            `}
          />
          {errors.phone && <p className="text-accent text-xs mt-1.5 font-medium">{errors.phone}</p>}
        </div>

        {/* Summary card */}
        <div className="bg-card rounded-2xl p-5 border-2 border-border mt-6">
          <h3 className="font-bold text-foreground text-right mb-4">סיכום הזמנה</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">שירות</span>
              <span className="font-semibold text-foreground">תספורת</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">תאריך</span>
              <span className="font-semibold text-foreground">
                {d.getDate().toString().padStart(2, '0')}/{(d.getMonth() + 1).toString().padStart(2, '0')}/{d.getFullYear()}
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

        {/* Submit */}
        <button
          type="submit"
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
              שולח קוד אימות...
            </span>
          ) : (
            'קבע תור'
          )}
        </button>
      </form>
    </div>
  );
}
