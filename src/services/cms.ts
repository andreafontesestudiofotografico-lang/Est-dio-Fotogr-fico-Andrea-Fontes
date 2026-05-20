import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { Package, SiteSettings, Coupon } from "../types";
import { handleFirestoreError, OperationType } from "./dbUtils";

// Packages
export async function getPackages(): Promise<Package[]> {
  try {
    const q = query(collection(db, "cms_packages"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "cms_packages");
    return [];
  }
}

export async function getPackage(id: string): Promise<Package | null> {
  try {
    const docRef = doc(db, "cms_packages", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Package;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `cms_packages/${id}`);
    return null;
  }
}

export async function savePackage(pkg: Package): Promise<void> {
  try {
    const { id, ...data } = pkg;
    await setDoc(doc(db, "cms_packages", id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `cms_packages/${pkg.id}`);
  }
}

export async function deletePackage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "cms_packages", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cms_packages/${id}`);
  }
}

// Site Settings
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const configDoc = await getDoc(doc(db, "cms_settings", "config"));
    if (configDoc.exists()) {
      return configDoc.data() as SiteSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "cms_settings/config");
    return null;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  try {
    await setDoc(doc(db, "cms_settings", "config"), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "cms_settings/config");
  }
}

// Coupons
export async function getCoupons(): Promise<Coupon[]> {
  try {
    const snapshot = await getDocs(collection(db, "cms_coupons"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "cms_coupons");
    return [];
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const q = query(collection(db, "cms_coupons"));
    const snapshot = await getDocs(q);
    const coupon = snapshot.docs.find(doc => doc.data().code.toUpperCase() === code.toUpperCase());
    if (coupon) {
      return { id: coupon.id, ...coupon.data() } as Coupon;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `cms_coupons (by code ${code})`);
    return null;
  }
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  try {
    const { id, ...data } = coupon;
    await setDoc(doc(db, "cms_coupons", id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `cms_coupons/${coupon.id}`);
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "cms_coupons", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cms_coupons/${id}`);
  }
}
