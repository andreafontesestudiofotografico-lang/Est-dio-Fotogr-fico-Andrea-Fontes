import React, { useRef, useEffect, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useResponsiveColumns } from "../../../hooks/useResponsiveColumns";
import { GalleryCard } from "./GalleryCard";
import { GalleryPhoto, GallerySelection } from "../../../types/gallery";

interface Props {
  photos: GalleryPhoto[];
  selections: Record<string, GallerySelection>;
  canSelect: boolean;
  onToggleSelect: (photoId: string) => void;
  onPhotoClick: (index: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function GalleryGrid({ photos, selections, canSelect, onToggleSelect, onPhotoClick, onLoadMore, hasMore }: Props) {
  const columns = useResponsiveColumns();
  const rowCount = Math.ceil(photos.length / columns);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth); // Default initially
  
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => {
       // Estimate item height = width. Width = containerWidth / columns.
       return containerWidth / columns; 
    },
    overscan: 2,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite Scroll Trigger
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 1 && hasMore) {
      onLoadMore();
    }
  }, [virtualItems, rowCount, hasMore, onLoadMore]);

  // Stable callbacks for GalleryCard
  const handleToggleSelect = React.useCallback((photoId: string) => {
    onToggleSelect(photoId);
  }, [onToggleSelect]);

  const handlePhotoClick = React.useCallback((index: number) => {
    onPhotoClick(index);
  }, [onPhotoClick]);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const rowPhotos = photos.slice(
          virtualRow.index * columns,
          (virtualRow.index + 1) * columns
        );

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
              display: 'flex',
            }}
          >
            {rowPhotos.map((photo, colIndex) => {
              const globalIndex = virtualRow.index * columns + colIndex;
              return (
                <div 
                  key={photo.id} 
                  style={{ width: `${100 / columns}%`, padding: '4px' }}
                >
                  <GalleryCard
                    photo={photo}
                    globalIndex={globalIndex}
                    isSelected={!!selections[photo.id]}
                    canSelect={canSelect}
                    onToggleSelect={handleToggleSelect}
                    onClick={handlePhotoClick}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
