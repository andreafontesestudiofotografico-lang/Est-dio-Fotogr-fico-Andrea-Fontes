import React, { useState, useEffect } from "react";
import { UploadItem, useGalleryUpload } from "../../../hooks/useGalleryUpload";

function PreviewImage({ file }: { file: File }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <img src={url} className="w-full h-full object-cover" alt="thumb" />;
}

export function GalleryUploadManager({ bookingId }: { bookingId: string }) {
  const { items, addFiles, startQueue, retry, isUploading } = useGalleryUpload(bookingId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight mb-4">Upload de Imagens (V2)</h2>
        
        <div className="flex gap-4 items-center">
          <input 
            type="file" 
            multiple 
            accept="image/jpeg, image/jpg" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-black file:text-white
              hover:file:bg-gray-800 transition-colors cursor-pointer"
          />
          <button 
            onClick={startQueue} 
            disabled={isUploading || items.filter(i => i.status === 'pending').length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Processando..." : "Iniciar Upload"}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white border border-gray-200">
          <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                     <PreviewImage file={item.file} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">{item.file.name}</p>
                    <p className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {item.status === 'pending' && <span className="text-xs font-semibold text-gray-400">Na Fila</span>}
                  {item.status === 'processing' && <span className="text-xs font-semibold text-orange-500">Processando...</span>}
                  {item.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                       <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 transition-all" style={{ width: `${item.progress}%` }} />
                       </div>
                       <span className="text-xs font-semibold text-blue-600 w-8">{Math.round(item.progress)}%</span>
                    </div>
                  )}
                  {item.status === 'success' && <span className="text-xs font-semibold text-green-600">Concluído</span>}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-red-600">Erro</span>
                      <button onClick={() => retry(item.id)} className="text-xs text-blue-600 hover:underline">Tentar Novamente</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
