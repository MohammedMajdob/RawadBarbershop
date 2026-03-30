'use client';

interface LogoProps {
  headerType?: string;
  headerMediaUrl?: string | null;
  logoUrl?: string | null;
  businessName?: string;
  phone?: string;
}

export default function Logo({
  headerType = 'image',
  headerMediaUrl,
  logoUrl,
  businessName = 'Gentlemen Barber Shop',
  phone = '050-2763455',
}: LogoProps) {
  return (
    <div className="w-full bg-white">
      {/* Cover / Header section */}
      <div className="relative">
        <div className="w-full h-[220px] md:h-[250px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {headerType === 'video' && headerMediaUrl ? (
            <video
              src={headerMediaUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              controls={false}
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el) {
                  el.muted = true;
                  el.play().catch(() => {});
                  // iOS: play on first touch anywhere
                  const playOnTouch = () => {
                    el.muted = true;
                    el.play().catch(() => {});
                    document.removeEventListener('touchstart', playOnTouch);
                  };
                  document.addEventListener('touchstart', playOnTouch, { once: true });
                  // Resume on tab return
                  const onVisible = () => {
                    if (document.visibilityState === 'visible') {
                      el.muted = true;
                      el.play().catch(() => {});
                    }
                  };
                  document.addEventListener('visibilitychange', onVisible);
                }
              }}
            />
          ) : headerMediaUrl ? (
            <img
              src={headerMediaUrl}
              alt={businessName}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 50%' }}
              loading="eager"
            />
          ) : null}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>

        {/* Logo overlapping bottom-left — outside overflow-hidden */}
        {logoUrl && (
          <div className="absolute -bottom-10 left-4 z-20">
            <div className="w-[88px] h-[88px] rounded-2xl bg-white p-1 shadow-xl border-2 border-[#c9a84c]/30">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="object-cover w-full h-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business info section */}
      <div className="px-4 pt-3 pb-2">
        {/* Name + location next to logo */}
        <div className={logoUrl ? 'pl-[104px]' : ''}>
          <h1 className="text-lg font-black text-gray-900">{businessName}</h1>
          <a
            href="https://ul.waze.com/ul?venue_id=23069002.230493408.2038009&overview=yes&utm_campaign=share_drive&utm_source=waze_app&utm_medium=lm_share_location"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-0.5 hover:opacity-70 transition-opacity"
          >
            <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
              {/* Waze ghost body */}
              <path d="M50 8C30 8 14 24 14 44c0 10 4 19 11 25.5l2 3L32 85l5-4 3 2c3 1.5 6.5 2.5 10 2.5s7-1 10-2.5l3-2 5 4 5-12.5 2-3C82 63 86 54 86 44 86 24 70 8 50 8z" fill="#33CCFF"/>
              {/* Left eye */}
              <ellipse cx="38" cy="42" rx="5" ry="6" fill="white"/>
              <circle cx="39" cy="43" r="3" fill="#1a1a1a"/>
              {/* Right eye */}
              <ellipse cx="62" cy="42" rx="5" ry="6" fill="white"/>
              <circle cx="63" cy="43" r="3" fill="#1a1a1a"/>
              {/* Smile */}
              <path d="M40 56c0 0 4 5 10 5s10-5 10-5" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              {/* Antenna */}
              <circle cx="72" cy="22" r="5" fill="#FF6B35"/>
              <path d="M68 26L62 35" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-blue-400 font-medium">כפר אבו סנאן</span>
          </a>
        </div>

        {/* Rating + Phone + Instagram row */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#c9a84c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">4.9</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <a
            href={`tel:${phone.replace(/-/g, '')}`}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-semibold" dir="ltr">{phone}</span>
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <a
            href="https://www.instagram.com/gentleman.barbershop1996?igsh=MTg1NHpjb2JkdTJzYg=="
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-500 hover:text-pink-500 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-sm font-semibold">Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
}
