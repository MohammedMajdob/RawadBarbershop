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

  // Don't render if no custom images
  if (!images || images.length === 0) return null;

  useEffect(() => {
    if (images && images.length > 1) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [images]);

  return (
    <div className="relative w-full h-44 md:h-52 rounded-2xl overflow-hidden mx-auto max-w-2xl shadow-md border border-gray-100">
      {images.map((slide, index) => (
        <div
          key={slide.id}
          className={`
            absolute inset-0 transition-all duration-700 ease-in-out
            ${index === current ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <img
            src={slide.url}
            alt={slide.title || ''}
            className="w-full h-full object-cover"
          />
          {slide.title && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-bold text-lg">{slide.title}</p>
            </div>
          )}
        </div>
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === current ? 'bg-white w-6' : 'bg-white/50 w-2'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}
