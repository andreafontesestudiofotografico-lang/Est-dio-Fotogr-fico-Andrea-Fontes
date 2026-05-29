import React, { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Trash2, CheckCircle, Save, ImageIcon, ExternalLink } from "lucide-react";
import { db, storage } from "../../services/firebase";
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { FEATURES } from "../../config/features";

export function GalleryManager({ booking, client, onBack }: { booking: any, client: any, onBack: () => void }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadLink, setDownloadLink] = useState(booking.downloadLink || "");
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    const photosRef = collection(db, "galleries", booking.id, "photos");
    const qPhotos = query(photosRef);
    
    const unsubscribe = onSnapshot(qPhotos, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [booking.id]);

  const handleDelete = async (photo: any) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    
    try {
      if (photo.url) {
         const fileRef = ref(storage, photo.url);
         await deleteObject(fileRef);
      }
      
      await deleteDoc(doc(db, "galleries", booking.id, "photos", photo.id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Erro ao excluir foto.");
    }
  };

  const handleSaveLink = async () => {
    if (downloadLink && !downloadLink.startsWith('http://') && !downloadLink.startsWith('https://')) {
      alert("O link de download deve ser uma URL válida começando com http:// ou https://");
      return;
    }
    
    setSavingLink(true);
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        downloadLink: downloadLink
      });
      alert("Link de download salvo com sucesso!");
    } catch (error) {
       console.error("Error saving link", error);
       alert("Erro ao salvar o link de download.");
    } finally {
       setSavingLink(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white border border-gray-200 p-6">
         <div className="flex items-center gap-6">
            <button onClick={onBack} className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
               <h2 className="font-black text-2xl tracking-tighter uppercase">{client?.name}</h2>
               <p className="text-sm font-medium text-gray-500">{booking.packageName}</p>
            </div>
         </div>
      </div>

      {/* Novo Sistema de Entrega de Fotos via Link */}
      <div className="bg-white border border-gray-200 p-8">
         <h3 className="font-black text-xl tracking-tight uppercase mb-2">Link de Entrega</h3>
         <p className="text-sm text-gray-500 font-medium mb-6 max-w-2xl">
            Insira abaixo o link de acesso aos arquivos finais do ensaio (Google Drive, OneDrive, WeTransfer, etc). Este link será exibido para o cliente na área de download.
         </p>
         
         <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full flex-1 relative">
               <input 
                 type="text" 
                 placeholder="https://exemplo.com/download..." 
                 value={downloadLink}
                 onChange={(e) => setDownloadLink(e.target.value)}
                 className="w-full border border-gray-200 p-4 font-medium text-sm outline-none focus:border-black transition-colors"
               />
               <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button 
               onClick={handleSaveLink}
               disabled={savingLink}
               className="bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
               <Save className="w-4 h-4" />
               {savingLink ? 'Salvando...' : 'Salvar Link'}
            </button>
         </div>
      </div>

      {/* Renderização de Galerias Legadas caso existam fotos - Mantido para compatibilidade */}
      {(photos.length > 0) && (
        <div className="bg-white border border-gray-200 p-8">
           <div className="flex justify-between items-end mb-8">
              <h3 className="font-bold uppercase tracking-widest text-sm text-gray-400">Galeria (Legado Registrado)</h3>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {photos.map(photo => (
                 <div key={photo.id} className="group relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
                    <img src={photo.url || photo.thumbPath} alt={photo.fileName || photo.filename} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                       {photo.status === 'selected_by_client' && (
                          <span className="bg-green-500 text-white p-2 rounded-full mb-2">
                             <CheckCircle className="w-4 h-4" />
                          </span>
                       )}
                       <button onClick={() => handleDelete(photo)} className="bg-white text-red-600 p-2 hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    {photo.status === 'selected_by_client' && (
                       <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
