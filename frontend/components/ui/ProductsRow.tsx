'use client';

interface ProductImage {
  id: string;
  url: string;
  title?: string | null;
}

interface ProductsRowProps {
  images: ProductImage[];
}

export default function ProductsRow({ images }: ProductsRowProps) {
  if (images.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <h3 className="text-base font-bold text-gray-900 text-right mb-3">המוצרים שלנו</h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            className="flex-shrink-0 w-[140px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="w-full h-[130px] bg-gray-50">
              <img
                src={img.url}
                alt={img.title || ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {img.title && (
              <div className="px-2.5 py-2">
                <p className="text-sm font-semibold text-gray-800 text-right leading-tight line-clamp-2">
                  {img.title}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
