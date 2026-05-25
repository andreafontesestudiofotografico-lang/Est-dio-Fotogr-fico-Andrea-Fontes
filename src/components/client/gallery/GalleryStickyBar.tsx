import React from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  selectedCount: number;
  maxSelections: number;
  onComplete: () => void;
  canSelect: boolean;
}

export function GalleryStickyBar({ selectedCount, maxSelections, onComplete, canSelect }: Props) {
  if (!canSelect) return null;

  const isComplete = selectedCount >= maxSelections;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-4 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-full">
            <CheckCircle className={`w-5 h-5 ${isComplete ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <div>
             <p className="text-sm font-bold text-gray-900">
               {selectedCount} de {maxSelections} selecionadas
             </p>
             {selectedCount > maxSelections && (
                <p className="text-xs font-semibold text-orange-500">
                   {selectedCount - maxSelections} fotos extras
                </p>
             )}
          </div>
        </div>
        <button 
          onClick={onComplete}
          className="w-full sm:w-auto px-8 py-3 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors"
        >
          Concluir Seleção
        </button>
      </div>
    </div>
  );
}
