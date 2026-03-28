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
              className="w-full h-full object-cover"
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
                  className="object-contain w-full h-full"
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
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-500">כפר אבו סנאן</span>
          </div>
        </div>

        {/* Rating + Phone + Price row */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#c9a84c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">4.9</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-semibold" dir="ltr">{phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
