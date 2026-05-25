import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../services/firebase";
import { collection, query, limit, startAfter, getDocs, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { GalleryStatus, GalleryPhoto, GallerySelection } from "../types/gallery";
import { useAuth } from "../services/AuthContext";
import { logger } from "../utils/logger";

export function useGalleryClient(bookingId: string) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selections, setSelections] = useState<Record<string, GallerySelection>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const lastDocRef = useRef<any>(null);
  const selectionsRef = useRef<Record<string, GallerySelection>>({});

  const PAGE_SIZE = 50;

  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  // 1. Fetch selections real-time (these are small documents and optimistic UI will apply changes immediately)
  useEffect(() => {
    if (!user) return;
    
    logger.info('GALLERY_CLIENT', `Subscribing to selections for ${bookingId}`);
    const selCollectionRef = collection(db, "galleries", bookingId, "selections");
    
    const unsubscribe = onSnapshot(selCollectionRef, (snapshot) => {
      const sels: Record<string, GallerySelection> = {};
      snapshot.docs.forEach(docSnap => {
        sels[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as GallerySelection;
      });
      setSelections(sels);
    }, (error) => {
      logger.error('GALLERY_CLIENT', "Error syncing selections", { error: error.message });
    });

    return () => unsubscribe();
  }, [bookingId, user]);

  // 2. Fetch photos progressively
  const fetchPhotos = useCallback(async (isNextPage = false) => {
    if (!user) return;
    if (isNextPage && (!hasMore || loadingMore)) return;
    if (!isNextPage) setLoading(true);
    else setLoadingMore(true);

    try {
      const photosRef = collection(db, "galleries", bookingId, "photos");
      let q = query(photosRef, orderBy("createdAt", "asc"), limit(PAGE_SIZE));

      if (isNextPage && lastDocRef.current) {
        q = query(photosRef, orderBy("createdAt", "asc"), startAfter(lastDocRef.current), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      
      const newPhotos = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as GalleryPhoto));
      
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setPhotos(prev => {
        if (isNextPage) {
          // Remove duplicates just in case
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = newPhotos.filter(p => !existingIds.has(p.id));
          return [...prev, ...filtered];
        }
        return newPhotos;
      });
    } catch (error: any) {
      logger.error('GALLERY_CLIENT', "Error fetching photos", { error: error.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [bookingId, hasMore, loadingMore, user]);

  // Initial fetch
  useEffect(() => {
    lastDocRef.current = null;
    fetchPhotos(false);
  }, [bookingId, fetchPhotos]);

  // 3. Selection action (Optimistic & Stable)
  const toggleSelection = useCallback(async (photoId: string, isExtra: boolean = false, extraPrice: number = 0) => {
    if (!user) return;

    const isSelected = !!selectionsRef.current[photoId];
    const prevSelectionState = selectionsRef.current[photoId];
    
    logger.info('GALLERY_CLIENT', `Toggling selection for photo ${photoId}, currently selected: ${isSelected}`);

    // Optimistic Update
    setSelections(prev => {
      const next = { ...prev };
      if (isSelected) {
        delete next[photoId];
      } else {
        next[photoId] = {
          id: photoId,
          selectedAt: new Date(),
          selectedBy: user.uid,
          isExtra,
          extraPrice
        };
      }
      return next;
    });

    try {
      const selRef = doc(db, "galleries", bookingId, "selections", photoId);
      if (isSelected) {
        await deleteDoc(selRef);
      } else {
        await setDoc(selRef, {
          selectedAt: serverTimestamp(),
          selectedBy: user.uid,
          isExtra,
          extraPrice
        });
      }
    } catch (error: any) {
      logger.error('GALLERY_CLIENT', "Error toggling selection", { error: error.message, photoId });
      // Revert optimistic update on error
      setSelections(prev => {
        const next = { ...prev };
        if (isSelected && prevSelectionState) {
          next[photoId] = prevSelectionState; // Restore
        } else {
          delete next[photoId]; // Remove
        }
        return next;
      });
    }
  }, [bookingId, user]);

  return {
    photos,
    selections,
    loading,
    loadingMore,
    hasMore,
    fetchNextPage: () => fetchPhotos(true),
    toggleSelection
  };
}
