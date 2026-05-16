import { auth, db } from "./firebase";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from "firebase/firestore";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    // ...
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Example Admin Fetch
export async function getAdminStats() {
  try {
    // This is a stub, actual implementation requires fetching multiple collections
    return {
      appointments: 24,
      revenue: "R$ 15.400",
      pendingGalleries: 8,
      newLeads: 12
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "multiple");
  }
}
