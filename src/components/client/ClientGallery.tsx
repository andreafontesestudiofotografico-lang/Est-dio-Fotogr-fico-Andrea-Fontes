import React, { useState, useCallback } from "react";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useGalleryClient } from "../../hooks/useGalleryClient";
import { GalleryGrid } from "./gallery/GalleryGrid";
import { GalleryLightbox } from "./gallery/GalleryLightbox";
import { GalleryStickyBar } from "./gallery/GalleryStickyBar";
import { db } from "../../services/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { logger } from "../../utils/logger";

export function ClientGallery({ booking, onBack }: { booking: any, onBack: () => void }) {
  const { photos, selections, loading, loadingMore, hasMore, fetchNextPage, toggleSelection } = useGalleryClient(booking.id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const canSelect = booking.status === 'in_selection' || booking.status === 'SELECTING';
  const selectedCount = Object.keys(selections).length;

  const handleComplete = async () => {
    try {
      logger.info('GALLERY_CLIENT', `Marking selection as locked for booking ${booking.id}`);
      await updateDoc(doc(db, "galleries", booking.id), {
        status: 'LOCKED', // V2 status
        selectionLockedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // also update booking legacy status to not break dashboard
      await updateDoc(doc(db, "bookings", booking.id), {
        status: 'in_editing',
        updatedAt: serverTimestamp()
      });
      onBack();
    } catch (e: any) {
       logger.error('GALLERY_CLIENT', "Error completing selection", { error: e.message });
       alert("Erro ao concluir seleção. Tente novamente.");
    }
  };

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
               <h2 className="font-black text-2xl tracking-tighter uppercase">Sua Galeria: {booking.packageName}</h2>
               {canSelect && (
                  <p className="text-sm font-medium text-gray-500 mt-1">Selecione as fotos que deseja para a edição final.</p>
               )}
            </div>
         </div>
      </div>

      <div className="bg-white border border-gray-200 p-2 sm:p-4">
         {loading && photos.length === 0 ? (
            <div className="text-center text-gray-500 py-20 font-medium">Carregando fotos...</div>
         ) : photos.length === 0 ? (
            <div className="text-center py-20 bg-gray-50">
               <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="font-bold text-gray-600 mb-2 uppercase tracking-wide">Galeria Vazia</p>
               <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">Suas fotos ainda não estão disponíveis. Acompanhe o status na timeline.</p>
             </div>
         ) : (
            <div className="min-h-[500px]">
               <GalleryGrid 
                 photos={photos} 
                 selections={selections} 
                 canSelect={canSelect}
                 onToggleSelect={toggleSelection}
                 onPhotoClick={setLightboxIndex}
                 hasMore={hasMore}
                 onLoadMore={fetchNextPage}
               />
               
               {loadingMore && (
                 <div className="py-8 text-center text-sm font-medium text-gray-400">
                    Carregando mais fotos...
                 </div>
               )}
            </div>
         )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox 
          photos={photos}
          initialIndex={lightboxIndex}
          selections={selections}
          canSelect={canSelect}
          onToggleSelect={toggleSelection}
          onClose={handleCloseLightbox}
        />
      )}

      <GalleryStickyBar 
        selectedCount={selectedCount}
        maxSelections={booking.maxSelections || parseInt(booking.packageOptions?.numPhotos || "0") || 1}
        canSelect={canSelect}
        onComplete={handleComplete}
      />
    </div>
  );
}
