import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, Trash2, CheckCircle, Clock, Image as ImageIcon } from "lucide-react";
import { db, storage } from "../../services/firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export function GalleryManager({ booking, client, onBack }: { booking: any, client: any, onBack: () => void }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure gallery doc exists (we use bookingId as galleryId for simplicity)
    const initGallery = async () => {
      const galleryRef = doc(db, "galleries", booking.id);
      const snap = await getDoc(galleryRef);
      if (!snap.exists()) {
         try {
            await setDoc(galleryRef, {
               bookingId: booking.id,
               clientId: booking.clientId,
               name: booking.packageName,
               status: 'in_selection',
               createdAt: serverTimestamp(),
               updatedAt: serverTimestamp()
            });
         } catch (error) {
            console.error("Failed to initialize gallery document:", error);
         }
      }
    };
    initGallery();

    const photosRef = collection(db, "galleries", booking.id, "photos");
    const qPhotos = query(photosRef);
    
    const unsubscribe = onSnapshot(qPhotos, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [booking.id, booking.clientId, booking.packageName]);

  const handleUpload = async (e: import("react").ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    const files: File[] = Array.from(e.target.files);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `galleries/${booking.id}/${file.name}-${Date.now()}`);
        const uploadTask = uploadBytesResumable(fileRef, file as Blob);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(currentProgress);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              
              const photoRef = doc(collection(db, "galleries", booking.id, "photos"));
              await setDoc(photoRef, {
                url,
                filename: file.name,
                status: 'raw',
                uploadedAt: serverTimestamp()
              });
              
              resolve();
            }
          );
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erro ao enviar fotos. Tente novamente.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photo: any) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    
    try {
      // Create a reference to the file to delete
      const fileRef = ref(storage, photo.url);
      await deleteObject(fileRef);
      
      // Delete document
      await deleteDoc(doc(db, "galleries", booking.id, "photos", photo.id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Erro ao excluir foto.");
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
         
         <div className="flex gap-4">
            <input 
               type="file" 
               multiple 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleUpload}
            />
            <button 
               disabled={uploading}
               onClick={() => fileInputRef.current?.click()} 
               className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
               <Upload className="w-4 h-4" /> 
               {uploading ? `Enviando (${Math.round(progress)}%)` : "Upload de Fotos"}
            </button>
         </div>
      </div>

      <div className="bg-white border border-gray-200 p-8">
         {loading ? (
            <div className="text-center text-gray-500 py-12 font-medium">Carregando fotos...</div>
         ) : photos.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200">
               <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="font-bold text-gray-600 mb-2 uppercase tracking-wide">Galeria Vazia</p>
               <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">Faça upload das fotos em alta resolução para que a cliente possa realizar a seleção.</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
               {photos.map(photo => (
                  <div key={photo.id} className="group relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
                     <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
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
         )}
      </div>
    </div>
  );
}
