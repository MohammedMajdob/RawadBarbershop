'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/api';

interface ProfilePageProps {
  token: string;
  profile: { id: string; name: string | null; phone: string };
  onProfileUpdate: (profile: { id: string; name: string | null; phone: string }) => void;
  onLogout: () => void;
  onNavigate: (tab: 'booking' | 'myBookings') => void;
}

export default function ProfilePage({ token, profile, onProfileUpdate, onLogout, onNavigate }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile(token, name.trim());
      onProfileUpdate(updated);
      setEditing(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון הפרופיל';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fadeInUp">
      {/* Title */}
      <h1 className="text-2xl font-black text-center text-foreground mb-8">פרופיל</h1>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-sm mb-6">
        <div className="flex items-center gap-4 flex-row-reverse">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 text-right">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-primary text-right outline-none bg-white text-foreground font-bold"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="flex-1 py-2 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50"
                  >
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(profile.name || ''); }}
                    className="flex-1 py-2 rounded-lg text-sm font-bold border border-border text-muted"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-black text-lg text-foreground">{profile.name || 'ללא שם'}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-primary text-sm font-semibold mt-1"
                >
                  עריכת פרטים
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden mb-6">
        {/* התורים שלי */}
        <button
          onClick={() => onNavigate('myBookings')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <div className="flex items-center gap-3 flex-row-reverse">
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-foreground">התורים שלי</span>
          </div>
        </button>

        {/* התנתקות */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-end px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-foreground underline">התנתקות</span>
        </button>
      </div>

    </div>
  );
}
