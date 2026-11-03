import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "./client";
import type { BusinessContext } from "@/lib/types";

export interface StoredBusiness {
  id: string;
  owner_id: string;
  name: string;
  purpose: string;
  department: string;
  province: string;
  district: string;
  context: BusinessContext;
  createdAt?: unknown;
}

export async function saveBusinessToFirestore(context: BusinessContext): Promise<string | null> {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth?.currentUser) return null;

  try {
    const docRef = await addDoc(collection(db, "businesses"), {
      owner_id: auth.currentUser.uid,
      owner_email: auth.currentUser.email,
      name: context.businessName || "Mi Negocio",
      purpose: context.purpose || "",
      department: context.department || "",
      province: context.province || "",
      district: context.district || "",
      context,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar negocio en Firestore:", error);
    return null;
  }
}

export async function getUserBusinesses(): Promise<StoredBusiness[]> {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth?.currentUser) return [];

  try {
    const q = query(
      collection(db, "businesses"),
      where("owner_id", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<StoredBusiness, "id">),
    }));
  } catch (error) {
    console.error("Error al obtener negocios:", error);
    return [];
  }
}

export async function getBusinessById(id: string): Promise<StoredBusiness | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, "businesses", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<StoredBusiness, "id">) };
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    return null;
  }
}
