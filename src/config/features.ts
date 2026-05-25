export const FEATURES = {
  // Global feature flag to enable or disable Gallery V2
  // When false, Gallery V2 is completely hidden from the app
  enableGalleryV2: true, 

  // Determine if Gallery is enabled for a specific booking
  isGalleryV2Enabled: (booking?: any): boolean => {
    if (!FEATURES.enableGalleryV2) return false;

    if (!booking) return false;

    // Per-booking feature flag check (gradual rollout)
    if (booking.galleryEnabled !== undefined) {
      return booking.galleryEnabled === true;
    }

    // Default to true for now since we are in dev/testing phase
    return true; 
  }
};
