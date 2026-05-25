export type GalleryStatus = 
  | 'UPLOADING'
  | 'READY'
  | 'SELECTING'
  | 'LOCKED'
  | 'PROCESSING'
  | 'DELIVERED';

export interface ProcessingProfile {
  thumbResolution: number;
  previewResolution: number;
  thumbQuality: number;
  previewQuality: number;
  watermarkOpacity: number;
}

export interface Gallery {
  id: string; // The same as bookingId
  status: GalleryStatus;
  maxSelections: number;
  extraPhotoPrice: number;
  allowExtraSelections: boolean;
  
  // Auditing fields
  uploadSessionId?: string;
  releasedAt?: any; // Firestore Timestamp
  selectionLockedAt?: any; // Firestore Timestamp
  processingFailedAt?: any; // Firestore Timestamp
  processingError?: string;
  storageBytesTotal?: number;
  releasedBy?: string;
  lockedBy?: string;

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface GalleryPhoto {
  id: string; // photoId

  // Fixed Original info (cannot be used by client)
  originalPath: string;
  originalSize: number;

  // Thumb info
  thumbPath: string;
  thumbSize: number;

  // Preview info
  previewPath: string;
  previewWidth: number;
  previewHeight: number;
  previewSize: number;

  // Final info
  finalPath?: string;

  // Original image info
  fileName: string;
  width: number;
  height: number;
  
  // Setup info
  processingVersion: number;
  createdAt: any; // Firestore Timestamp
}

export interface GallerySelection {
  id: string; // matches photoId
  selectedAt: any; // Firestore Timestamp
  selectedBy: string; // client ID
  isExtra: boolean;
  extraPrice: number;
}
