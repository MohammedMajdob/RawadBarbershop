'use client';

function fixCloudinaryUrl(url: string): string {
  if (!url.includes('cloudinary.com')) return url;
  // Override any existing transformation to show full image with white bg
  return url.replace('/upload/', '/upload/c_pad,b_white,w_500,h_500,q_auto,f_webp/');
}

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
    <div className="mt-3 px-4 py-4 bg-[#1a1a2e]">
      <h3 className="text-base font-bold text-white text-right mb-3">המוצרים שלנו</h3>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            className="flex-shrink-0 w-[110px] bg-white rounded-xl overflow-hidden"
          >
            <div className="w-[110px] h-[110px] bg-white flex items-center justify-center p-2">
              <img
                src={fixCloudinaryUrl(img.url)}
                alt={img.title || ''}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            {img.title && (
              <div className="px-2.5 py-2 bg-white">
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
