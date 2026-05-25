import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { getCachedDownloadURL } from "../../../utils/storageCache";
import { GalleryPhoto } from "../../../types/gallery";

interface Props {
  photo: GalleryPhoto;
  globalIndex: number;
  isSelected: boolean;
  canSelect: boolean;
  onToggleSelect: (photoId: string) => void;
  onClick: (index: number) => void;
}

export const GalleryCard = React.memo(({ photo, globalIndex, isSelected, canSelect, onToggleSelect, onClick }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCachedDownloadURL(photo.thumbPath)
      .then(u => {
        if (mounted) setUrl(u);
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [photo.thumbPath]);

  const handleToggle = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(photo.id);
  }, [onToggleSelect, photo.id]);

  const handleClick = React.useCallback(() => {
    onClick(globalIndex);
  }, [onClick, globalIndex]);

  return (
    <div 
      className={`group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer ${isSelected ? 'border-green-500 border-4' : 'border border-gray-200'}`}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {url && (
        <img 
          src={url} 
          alt={photo.fileName} 
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onClick={handleClick}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
        />
      )}

      {canSelect && (
        <div 
          onClick={handleToggle}
          className={`absolute inset-0 transition-colors ${isSelected ? 'bg-green-500/20' : 'group-hover:bg-black/10'}`}
        >
          <div className="absolute top-4 right-4 bg-white rounded-full shadow-sm cursor-pointer">
            <CheckCircle className={`w-8 h-8 transition-colors ${isSelected ? 'text-green-500' : 'text-gray-300'}`} />
          </div>
        </div>
      )}
      
      {!canSelect && isSelected && (
         <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
      )}
    </div>
  );
});
