'use client';

interface ConfirmationProps {
  booking: {
    name: string;
    date: string;
    time: string;
  };
  onNewBooking: () => void;
}

export default function Confirmation({ booking, onNewBooking }: ConfirmationProps) {
  // Parse as local date to avoid timezone shift
  const [year, month, day] = booking.date.split('-').map(Number);

  return (
    <div className="text-center max-w-md mx-auto animate-scaleIn space-y-6">
      {/* Success icon */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-success/10 animate-ping" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-success">התור נקבע בהצלחה!</h2>
        <p className="text-muted mt-1">נתראה בקרוב</p>
      </div>

      {/* Booking details card */}
      <div className="bg-card rounded-2xl p-6 border-2 border-success/20 shadow-lg text-right">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">שם</span>
            <span className="font-bold text-foreground">{booking.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">תאריך</span>
            <span className="font-semibold text-foreground">
              {day.toString().padStart(2, '0')}/{month.toString().padStart(2, '0')}/{year}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">שעה</span>
            <span className="font-semibold text-foreground">{booking.time}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNewBooking}
        className="w-full py-3.5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all duration-200 active:scale-[0.98]"
      >
        הזמן תור נוסף
      </button>
    </div>
  );
}
