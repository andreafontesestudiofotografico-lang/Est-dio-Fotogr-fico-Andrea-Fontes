import { useState, useEffect } from "react";
import { Download, CheckCircle, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { db } from "../../services/firebase";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export function ClientGallery({ booking, onBack }: { booking: any, onBack: () => void }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const photosRef = collection(db, "galleries", booking.id, "photos");
    const qPhotos = query(photosRef);
    
    const unsubscribe = onSnapshot(qPhotos, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [booking.id]);

  const toggleSelectPhoto = async (photo: any) => {
    if (booking.status !== 'in_selection') return;
    
    const newStatus = photo.status === 'selected_by_client' ? 'raw' : 'selected_by_client';
    
    try {
      await updateDoc(doc(db, "galleries", booking.id, "photos", photo.id), {
        status: newStatus
      });
    } catch (error) {
       console.error("Erro ao selecionar foto", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
               <h2 className="font-black text-2xl tracking-tighter uppercase">Sua Galeria: {booking.packageName}</h2>
               {booking.status === 'in_selection' && (
                  <p className="text-sm font-medium text-gray-500 mt-1">Selecione as fotos que deseja para a edição final.</p>
               )}
            </div>
         </div>
         {['ready', 'completed'].includes(booking.status) && (
            <button className="bg-black text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2">
               <Download className="w-4 h-4" /> Baixar Todas (ZIP)
            </button>
         )}
      </div>

      <div className="bg-gray-50 border border-gray-200 p-8">
         {loading ? (
            <div className="text-center text-gray-500 py-12 font-medium">Carregando fotos...</div>
         ) : photos.length === 0 ? (
            <div className="text-center py-20">
               <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="font-bold text-gray-600 mb-2 uppercase tracking-wide">Galeria Vazia</p>
               <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">Suas fotos ainda não estão disponíveis. Acompanhe o status na timeline.</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {photos.map(photo => {
                  const isSelected = photo.status === 'selected_by_client';
                  const canSelect = booking.status === 'in_selection';
                  return (
                  <div 
                     key={photo.id} 
                     onClick={() => canSelect && toggleSelectPhoto(photo)}
                     className={`group relative aspect-square bg-white border overflow-hidden ${canSelect ? 'cursor-pointer hover:border-black' : ''} ${isSelected ? 'border-green-500 border-4' : 'border-gray-200'}`}
                  >
                     <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
                     {canSelect && (
                        <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-green-500/20' : 'group-hover:bg-black/10'}`}>
                           <div className="absolute top-4 right-4 bg-white rounded-full">
                              <CheckCircle className={`w-8 h-8 transition-colors ${isSelected ? 'text-green-500' : 'text-gray-300'}`} />
                           </div>
                        </div>
                     )}
                     {booking.status !== 'in_selection' && isSelected && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                     )}
                  </div>
               )})}
            </div>
         )}
      </div>
    </div>
  );
}
