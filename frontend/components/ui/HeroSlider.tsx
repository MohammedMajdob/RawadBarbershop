'use client';

import { useState, useEffect, Component, type ReactNode } from 'react';

// Error boundary to prevent crashes
class SliderErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface HeroImage {
  id: string;
  url: string;
  title?: string | null;
}

interface HeroSliderProps {
  images?: HeroImage[];
}

function HeroSliderInner({ images }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const validImages = (images || []).filter(
    (img) => img && img.url && typeof img.url === 'string' && !imgErrors.has(img.id),
  );

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % validImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  const activeIndex = current % validImages.length;

  return (
    <div className="relative w-full h-44 md:h-52 rounded-2xl overflow-hidden mx-auto max-w-2xl shadow-md border border-gray-100">
      {validImages.map((slide, index) => (
        <div
          key={slide.id}
          className={`
            absolute inset-0 transition-all duration-700 ease-in-out
            ${index === activeIndex ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <img
            src={slide.url}
            alt={slide.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
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
                ${index === activeIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSlider({ images }: HeroSliderProps) {
  return (
    <SliderErrorBoundary>
      <HeroSliderInner images={images} />
    </SliderErrorBoundary>
  );
}
