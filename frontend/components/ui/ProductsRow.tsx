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
    <div className="py-2 px-3">
      <div
        className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((img) => (
          <div key={img.id} className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-gray-100">
              <img
                src={img.url}
                alt={img.title || ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {img.title && (
              <p className="text-[10px] text-center text-gray-600 truncate w-[68px] font-medium leading-tight">
                {img.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
