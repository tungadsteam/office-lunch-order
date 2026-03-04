'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  baseUrl: string;
  className?: string;
}

export function ImageGallery({ images, baseUrl, className = '' }: ImageGalleryProps) {
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const getFullUrl = (url: string) =>
    url.startsWith('http') ? url : `${baseUrl}${url}`;

  return (
    <>
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setViewingIdx(i)}
            className="w-16 h-16 rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-400 transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullUrl(url)}
              alt={`Ảnh ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen lightbox */}
      {viewingIdx !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingIdx(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullUrl(images[viewingIdx])}
              alt={`Ảnh ${viewingIdx + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setViewingIdx(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg text-lg font-bold"
            >
              ✕
            </button>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setViewingIdx((viewingIdx - 1 + images.length) % images.length)}
                  className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow text-lg"
                >
                  ‹
                </button>
                <span className="bg-white/90 rounded-full px-3 py-2 text-sm font-medium shadow">
                  {viewingIdx + 1} / {images.length}
                </span>
                <button
                  onClick={() => setViewingIdx((viewingIdx + 1) % images.length)}
                  className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow text-lg"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
