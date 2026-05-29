import React, { useState } from "react";
import { AlertCircle, Trash2, CheckCircle } from "lucide-react";
import { db } from "../../services/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

export function CleanupManager() {
  const [step, setStep] = useState<"idle" | "confirm1" | "confirm2" | "cleaning" | "done">("idle");
  const [counts, setCounts] = useState({ bookings: 0, galleries: 0, photos: 0, selections: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setStep("cleaning"); // temporarily just to show loading
      setError(null);
      
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const galleriesSnap = await getDocs(collection(db, "galleries"));
      
      let photoCount = 0;
      let selectionCount = 0;

      for (const galleryDoc of galleriesSnap.docs) {
         const photosSnap = await getDocs(collection(db, "galleries", galleryDoc.id, "photos"));
         const selectionsSnap = await getDocs(collection(db, "galleries", galleryDoc.id, "selections"));
         photoCount += photosSnap.size;
         selectionCount += selectionsSnap.size;
      }

      setCounts({
         bookings: bookingsSnap.size,
         galleries: galleriesSnap.size,
         photos: photoCount,
         selections: selectionCount
      });

      setStep("confirm1");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao analisar a base de dados: " + err.message);
      setStep("idle");
    }
  };

  const handleConfirm1 = () => {
    setStep("confirm2");
  };

  const executeCleanup = async () => {
    setStep("cleaning");
    setError(null);

    let deletedCounts = { bookings: 0, galleries: 0, photos: 0, selections: 0 };

    try {
      // Setup batching. Firestore limits batches to 500 operations.
      // For a test base, this is usually enough, but we can do chunks if needed.
      // To be completely safe and avoid complicated chunk management here, we will just process in chunks
      
       let currentBatch = writeBatch(db);
       let operationCount = 0;

       const commitBatchIfNeeded = async () => {
          if (operationCount >= 450) { // arbitrary safe number under 500
             await currentBatch.commit();
             currentBatch = writeBatch(db);
             operationCount = 0;
          }
       };

      const galleriesSnap = await getDocs(collection(db, "galleries"));
      
      for (const galleryDoc of galleriesSnap.docs) {
         const galleryId = galleryDoc.id;
         
         // Delete Selections Subcollection
         const selectionsRef = collection(db, "galleries", galleryId, "selections");
         const selectionsSnap = await getDocs(selectionsRef);
         for (const sel of selectionsSnap.docs) {
            currentBatch.delete(doc(db, "galleries", galleryId, "selections", sel.id));
            operationCount++;
            deletedCounts.selections++;
            await commitBatchIfNeeded();
         }

         // Delete Photos Subcollection
         const photosRef = collection(db, "galleries", galleryId, "photos");
         const photosSnap = await getDocs(photosRef);
         for (const photo of photosSnap.docs) {
            currentBatch.delete(doc(db, "galleries", galleryId, "photos", photo.id));
            operationCount++;
            deletedCounts.photos++;
            await commitBatchIfNeeded();
         }
         
         // Delete Gallery Document
         currentBatch.delete(doc(db, "galleries", galleryId));
         operationCount++;
         deletedCounts.galleries++;
         await commitBatchIfNeeded();
      }

      const bookingsSnap = await getDocs(collection(db, "bookings"));
      for (const booking of bookingsSnap.docs) {
         currentBatch.delete(doc(db, "bookings", booking.id));
         operationCount++;
         deletedCounts.bookings++;
         await commitBatchIfNeeded();
      }

      if (operationCount > 0) {
         await currentBatch.commit();
      }

      setCounts(deletedCounts);
      setStep("done");

    } catch (err: any) {
      console.error(err);
      setError("Erro durante a exclusão: " + err.message);
      // Even if failed midway, we show 'done' but with error to show what was deleted up to failure
      setStep("done");
    }
  };

  const reset = () => {
    setStep("idle");
    setCounts({ bookings: 0, galleries: 0, photos: 0, selections: 0 });
    setError(null);
  };

  return (
    <div className="bg-red-50 border border-red-200 p-8 flex flex-col gap-6">
      <div>
         <h2 className="text-red-700 font-black text-xl uppercase tracking-tighter mb-2 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Limpar Base de Testes (Implantação)
         </h2>
         <p className="text-red-600 font-medium text-sm">
            Esta é uma ferramenta temporária de entrada em produção. Ela removerá exclusivamente os dados operacionais:<br/>
            <strong>Bookings (agendamentos de teste), Galerias V1 e V2, e subcoleções (Fotos e Seleções)</strong> vinculadas aos ensaios.<br/>
            Usuários, clientes (CRM), cupons, pacotes e configurações serão preservados intactos.
         </p>
      </div>

      {error && (
         <div className="bg-white border-l-4 border-red-600 p-4 font-bold text-red-600 text-sm">
            {error}
         </div>
      )}

      {step === "idle" && (
        <div>
           <button 
             onClick={handleStart} 
             className="bg-red-600 text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2"
           >
             <Trash2 className="w-4 h-4" /> 
             Iniciar Análise de Limpeza
           </button>
        </div>
      )}

      {(step === "confirm1" || step === "confirm2") && (
         <div className="bg-white p-6 border border-red-200">
            <h3 className="font-bold text-gray-800 uppercase tracking-widest text-sm mb-4">Registros Encontrados</h3>
            <ul className="text-sm font-medium text-gray-600 space-y-2 mb-6">
               <li><strong>{counts.bookings}</strong> Bookings (Agendamentos e testes)</li>
               <li><strong>{counts.galleries}</strong> Galerias (Documentos principais)</li>
               <li><strong>{counts.photos}</strong> Fotos (Subcoleção de galerias)</li>
               <li><strong>{counts.selections}</strong> Seleções (Subcoleção de galerias)</li>
            </ul>

            {step === "confirm1" && (
               <div className="bg-yellow-50 p-4 border border-yellow-200">
                  <p className="text-yellow-700 font-bold mb-4 uppercase tracking-widest text-xs">Tem certeza que deseja apagar os registros listados acima?</p>
                  <div className="flex gap-4">
                     <button onClick={handleConfirm1} className="bg-red-600 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-red-700">
                        Sim, tenho certeza
                     </button>
                     <button onClick={reset} className="bg-white border border-gray-300 text-gray-600 px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
                        Cancelar
                     </button>
                  </div>
               </div>
            )}

            {step === "confirm2" && (
               <div className="bg-red-100 p-4 border border-red-300">
                  <p className="text-red-700 font-bold mb-4 uppercase tracking-widest text-xs">Aviso Final: Esta ação não poderá ser desfeita.</p>
                  <div className="flex gap-4">
                     <button onClick={executeCleanup} className="bg-red-700 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors">
                        Confirmar Exclusão Definitiva
                     </button>
                     <button onClick={reset} className="bg-white border border-gray-300 text-gray-600 px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
                        Cancelar
                     </button>
                  </div>
               </div>
            )}
         </div>
      )}

      {step === "cleaning" && (
         <div className="p-6 bg-white border border-red-200 font-bold text-gray-600 flex items-center justify-center py-12 text-sm uppercase tracking-widest">
            Aguarde, processando exclusões...
         </div>
      )}

      {step === "done" && (
         <div className="bg-green-50 p-6 border border-green-200 text-green-800">
            <h3 className="font-black flex items-center gap-2 mb-4 uppercase tracking-widest">
               <CheckCircle className="w-5 h-5 text-green-600" />
               Limpeza Concluída
            </h3>
            {error && <p className="mb-4 text-red-600 font-bold text-sm">Atenção: Houve um erro parcial ({error}). Relatório abaixo:</p>}
            <ul className="text-sm font-medium space-y-2 mb-6">
               <li><strong>{counts.bookings}</strong> Bookings removidos</li>
               <li><strong>{counts.galleries}</strong> Galerias removidas</li>
               <li><strong>{counts.photos}</strong> Fotos removidas</li>
               <li><strong>{counts.selections}</strong> Seleções removidas</li>
            </ul>
            <p className="text-xs font-bold uppercase tracking-widest mb-6">
               A interface já foi atualizada automaticamente. Não é necessário recarregar a página.
            </p>
            <button onClick={reset} className="bg-green-600 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-green-700">
               Ocultar Relatório
            </button>
         </div>
      )}
    </div>
  );
}
