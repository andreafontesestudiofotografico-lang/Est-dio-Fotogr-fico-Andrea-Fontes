import { useState, useCallback, useRef } from "react";
import { storage, db } from "../services/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { processImage } from "../utils/imageProcessing";
import { logger } from "../utils/logger";

// Polyfill for randomUUID
const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export type UploadItemStatus = "pending" | "processing" | "uploading" | "success" | "error";

export interface UploadItem {
  id: string; // The generated photoId
  file: File;
  status: UploadItemStatus;
  progress: number;
  error?: string;
}

export function useGalleryUpload(bookingId: string) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploadingRef = useRef(false);
  const itemsRef = useRef<UploadItem[]>([]); // To bypass closure capture inside loop

  const addFiles = useCallback((files: File[]) => {
    // Only accept JPEG/JPG to start, max 25MB
    const validFiles = files.filter(f => {
      if (!f.type.startsWith("image/jp")) return false; // allow jpeg/jpg
      if (f.size > 25 * 1024 * 1024) return false;
      return true;
    });

    const newItems: UploadItem[] = validFiles.map(file => ({
      id: uuid(),
      file,
      status: "pending",
      progress: 0
    }));

    setItems(prev => {
      const nextItems = [...prev, ...newItems];
      itemsRef.current = nextItems;
      return nextItems;
    });
  }, []);

  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setItems(prev => {
      const nextItems = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      itemsRef.current = nextItems;
      return nextItems;
    });
  };

  const processQueue = async () => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    const maxConcurrent = 3;
    let activeUploads = 0;

    const executeNext = async (): Promise<void> => {
      const pendingItem = itemsRef.current.find(i => i.status === "pending");
      if (!pendingItem) return;

      activeUploads++;
      updateItem(pendingItem.id, { status: "processing" });

      try {
        const file = pendingItem.file;
        const sessionId = Date.now().toString();

        // 1. Process Thumb (300px, quality 0.55)
        const thumb = await processImage(file, {
          maxWidth: 300,
          maxHeight: 300,
          quality: 0.55
        });

        // 2. Process Preview (1600px, watermark, quality 0.70)
        // Yield to avoid freezing main thread
        await new Promise(r => setTimeout(r, 50)); 
        const preview = await processImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.70,
          withWatermark: true,
          watermarkOpacity: 0.1
        });

        updateItem(pendingItem.id, { status: "uploading", progress: 10 });
        await new Promise(r => setTimeout(r, 50)); 

        // 3. Upload Original
        const ext = file.name.split('.').pop() || 'jpg';
        const fileHash = `${sessionId}-${pendingItem.id}`;
        
        const originalPath = `galleries/${bookingId}/original/${fileHash}.${ext}`;
        const previewPath = `galleries/${bookingId}/preview/${fileHash}.webp`;
        const thumbPath = `galleries/${bookingId}/thumb/${fileHash}.webp`;

        // Upload in parallel? No, to save ram and network, sequence or simple Promise.all
        // since blobs are in memory, let's free them ASAP after upload
        
        const uploadOriginal = uploadBytesResumable(ref(storage, originalPath), file);
        const uploadPreview = uploadBytesResumable(ref(storage, previewPath), preview.blob);
        const uploadThumb = uploadBytesResumable(ref(storage, thumbPath), thumb.blob);

        let completed = 0;
        const updateProg = () => {
           completed++;
           updateItem(pendingItem.id, { progress: 10 + (completed / 3) * 80 });
        };

        await Promise.all([
           uploadOriginal.then(updateProg),
           uploadPreview.then(updateProg),
           uploadThumb.then(updateProg)
        ]);

        // 4. Save Metadata to Firestore
        const photoRef = doc(db, "galleries", bookingId, "photos", pendingItem.id);
        await setDoc(photoRef, {
          fileName: file.name,
          thumbPath,
          previewPath,
          originalPath,
          width: preview.width,  // Store preview dimensions as base
          height: preview.height,
          
          thumbSize: thumb.size,
          previewSize: preview.size,
          originalSize: file.size,
          
          createdAt: serverTimestamp(),
          processingVersion: 1
        });

        updateItem(pendingItem.id, { status: "success", progress: 100 });
      } catch (error: any) {
        console.error("Upload failed for item", pendingItem.id, error);
        updateItem(pendingItem.id, { status: "error", error: error.message });
      } finally {
        activeUploads--;
        // Yield before starting next
        setTimeout(() => executeNext(), 50); 
      }
    };

    const workers = [];
    for (let i = 0; i < maxConcurrent; i++) {
       workers.push(executeNext());
    }
    
    // Instead of Promise.all, we just wait for queue to drain if we wanted, 
    // but the loop above just sets up N chains of executeNext. Since executeNext 
    // only runs once per chain, wait, we need a recursive loop.
  };

  // Fixed queue runner
  const startQueue = useCallback(() => {
    if (isUploadingRef.current) return;
    logger.info('GALLERY_UPLOAD', `Starting upload queue for booking ${bookingId}`);
    isUploadingRef.current = true;

    let activeUploads = 0;
    const maxConcurrent = 3;

    const work = async () => {
      while (true) {
        const pendingItem = itemsRef.current.find(i => i.status === "pending");
        if (!pendingItem) {
           break;
        }

        updateItem(pendingItem.id, { status: "processing" });

        try {
          const file = pendingItem.file;
          const sessionId = Date.now().toString();
          logger.info('GALLERY_UPLOAD', `Processing image ${file.name}`, { photoId: pendingItem.id, fileOriginalSize: file.size });

          const thumb = await processImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.55 });
          await new Promise(r => setTimeout(r, 50)); 
          const preview = await processImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.70, withWatermark: true, watermarkOpacity: 0.1 });
          
          updateItem(pendingItem.id, { status: "uploading", progress: 10 });
          logger.info('GALLERY_UPLOAD', `Uploading images to storage for ${file.name}`);

          const ext = file.name.split('.').pop() || 'jpg';
          const fileHash = `${sessionId}-${pendingItem.id}`;
          
          const originalPath = `galleries/${bookingId}/original/${fileHash}.${ext}`;
          const previewPath = `galleries/${bookingId}/preview/${fileHash}.webp`;
          const thumbPath = `galleries/${bookingId}/thumb/${fileHash}.webp`;

          await uploadBytesResumable(ref(storage, originalPath), file);
          updateItem(pendingItem.id, { progress: 40 });
          
          await uploadBytesResumable(ref(storage, previewPath), preview.blob);
          updateItem(pendingItem.id, { progress: 70 });
          
          await uploadBytesResumable(ref(storage, thumbPath), thumb.blob);
          updateItem(pendingItem.id, { progress: 90 });

          const photoRef = doc(db, "galleries", bookingId, "photos", pendingItem.id);
          await setDoc(photoRef, {
            fileName: file.name,
            thumbPath,
            previewPath,
            originalPath,
            width: preview.width,
            height: preview.height,
            thumbSize: thumb.size,
            previewSize: preview.size,
            originalSize: file.size,
            createdAt: serverTimestamp(),
            processingVersion: 1
          });

          logger.info('GALLERY_UPLOAD', `Item successfully uploaded for ${file.name}`, { photoId: pendingItem.id });
          updateItem(pendingItem.id, { status: "success", progress: 100 });
        } catch (error: any) {
          logger.error('GALLERY_UPLOAD', `Upload failed for ${pendingItem.file.name}`, { error: error.message || error, photoId: pendingItem.id });
          updateItem(pendingItem.id, { status: "error", error: error.message });
        }
      }
    };

    const runners = [];
    for (let i = 0; i < maxConcurrent; i++) {
        runners.push(work());
    }

    Promise.all(runners).then(() => {
       logger.info('GALLERY_UPLOAD', `Upload queue finished for booking ${bookingId}`);
       isUploadingRef.current = false;
    });

  }, [bookingId]);

  const retry = (id: string) => updateItem(id, { status: "pending", progress: 0, error: undefined });

  return { items, addFiles, startQueue, retry, isUploading: isUploadingRef.current };
}
