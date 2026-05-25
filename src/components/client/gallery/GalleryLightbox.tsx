import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { getCachedDownloadURL } from "../../../utils/storageCache";
import { GalleryPhoto } from "../../../types/gallery";

interface Props {
  photos: GalleryPhoto[];
  initialIndex: number;
  selections: Record<string, any>; // accept GallerySelection objects easily
  canSelect: boolean;
  onToggleSelect: (photoId: string) => void;
  onClose: () => void;
}

export function GalleryLightbox({ photos, initialIndex, selections, canSelect, onToggleSelect, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const touchStartX = useRef<number | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const loadUrl = useCallback(async (index: number) => {
    if (!photos[index]) return;
    setLoading(true);
    try {
      const u = await getCachedDownloadURL(photos[index].previewPath);
      setCurrentUrl(u);
      
      // Pre-cache next and prev silently
      if (photos[index + 1]) getCachedDownloadURL(photos[index + 1].previewPath).catch(() => {});
      if (photos[index - 1]) getCachedDownloadURL(photos[index - 1].previewPath).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [photos]);

  useEffect(() => {
    loadUrl(currentIndex);
  }, [currentIndex, loadUrl]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, photos.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === " " && canSelect && photos[currentIndex]) {
      e.preventDefault();
      onToggleSelect(photos[currentIndex].id);
    }
  }, [onClose, handleNext, handlePrev, canSelect, onToggleSelect, photos, currentIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    const now = Date.now();
    if (now - lastSwipeTime.current < 300) {
      touchStartX.current = null;
      return; // throttle rapid swipes
    }

    if (diff > 50) {
      handleNext();
      lastSwipeTime.current = now;
    } else if (diff < -50) {
      handlePrev();
      lastSwipeTime.current = now;
    }
    touchStartX.current = null;
  };

  const toggleCurrent = React.useCallback(() => {
    const currentPhoto = photos[currentIndex];
    if (currentPhoto) {
      onToggleSelect(currentPhoto.id);
    }
  }, [photos, currentIndex, onToggleSelect]);

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const isSelected = !!selections[currentPhoto.id];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300" style={{ touchAction: 'none' }}>
      
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="text-white text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="flex items-center gap-4">
          {canSelect && (
            <button 
              onClick={toggleCurrent}
              className="flex items-center gap-2 text-white bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full transition-colors"
            >
              <CheckCircle className={`w-5 h-5 ${isSelected ? 'text-green-500 fill-white' : 'text-white'}`} />
              <span className="text-sm font-bold uppercase tracking-wider">{isSelected ? 'Selecionada' : 'Selecionar'}</span>
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Prev Area */}
      <div 
         className="absolute left-0 inset-y-0 w-1/6 hidden sm:flex items-center justify-start p-4 hover:bg-black/10 cursor-pointer z-10"
         onClick={handlePrev}
      >
         {currentIndex > 0 && <ChevronLeft className="w-12 h-12 text-white opacity-50 hover:opacity-100 transition-opacity" />}
      </div>

      {/* Image Container */}
      <div 
         className="w-full h-full flex items-center justify-center"
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}
      >
         {loading && <div className="absolute w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />}
         
         {currentUrl && (
            <img 
              src={currentUrl} 
              alt={currentPhoto.fileName} 
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              draggable={false}
            />
         )}
      </div>

      {/* Next Area */}
      <div 
         className="absolute right-0 inset-y-0 w-1/6 hidden sm:flex items-center justify-end p-4 hover:bg-black/10 cursor-pointer z-10"
         onClick={handleNext}
      >
         {currentIndex < photos.length - 1 && <ChevronRight className="w-12 h-12 text-white opacity-50 hover:opacity-100 transition-opacity" />}
      </div>

    </div>
  );
}
