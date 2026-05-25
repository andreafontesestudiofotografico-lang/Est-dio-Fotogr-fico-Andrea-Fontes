import { storage } from "../services/firebase";
import { ref, getDownloadURL } from "firebase/storage";

const MAX_CACHE_SIZE = 150;
const urlCache = new Map<string, Promise<string>>();

export const getCachedDownloadURL = (path: string): Promise<string> => {
  if (urlCache.has(path)) {
    // Move to end (most recently used)
    const promise = urlCache.get(path)!;
    urlCache.delete(path);
    urlCache.set(path, promise);
    return promise;
  }

  const promise = getDownloadURL(ref(storage, path)).catch(err => {
    // If it fails, remove from cache so it can be retried later
    urlCache.delete(path);
    throw err;
  });

  urlCache.set(path, promise);
  
  // Enforce limit
  if (urlCache.size > MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    if (firstKey) {
        urlCache.delete(firstKey);
    }
  }
  
  return promise;
};
