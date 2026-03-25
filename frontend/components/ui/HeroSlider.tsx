'use client';

import { useState, useEffect } from 'react';

interface HeroImage {
  id: string;
  url: string;
  title?: string;
}

interface HeroSliderProps {
  images?: HeroImage[];
}

export default function HeroSlider({ images }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images]);

  // Filter out images with broken URLs
  const validImages = (images || []).filter(
    (img) => img.url && !imgErrors.has(img.id),
  );

  if (validImages.length === 0) return null;

  return (
    <div className="relative w-full h-44 md:h-52 rounded-2xl overflow-hidden mx-auto max-w-2xl shadow-md border border-gray-100">
      {validImages.map((slide, index) => (
        <div
          key={slide.id}
          className={`
            absolute inset-0 transition-all duration-700 ease-in-out
            ${index === current % validImages.length ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <img
            src={slide.url}
            alt={slide.title || ''}
            className="w-full h-full object-cover"
            onError={() =>
              setImgErrors((prev) => new Set(prev).add(slide.id))
            }
          />
          {slide.title && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-bold text-lg">{slide.title}</p>
            </div>
          )}
        </div>
      ))}

      {validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === current % validImages.length ? 'bg-white w-6' : 'bg-white/50 w-2'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}
