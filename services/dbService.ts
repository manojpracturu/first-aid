import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { UserProfile, ChatMessage } from "../types";

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    // Try Firestore
    await setDoc(doc(db, "users", profile.uid), profile);
  } catch (error) {
    console.warn("Firestore save failed (likely missing config), using localStorage", error);
    localStorage.setItem(`user_${profile.uid}`, JSON.stringify(profile));
    await delay(500);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (error) {
    console.warn("Firestore get failed (likely missing config), using localStorage", error);
    const local = localStorage.getItem(`user_${uid}`);
    if (local) return JSON.parse(local);
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.warn("Firestore update failed, using localStorage");
    const local = localStorage.getItem(`user_${uid}`);
    if (local) {
      const current = JSON.parse(local);
      const updated = { ...current, ...data };
      localStorage.setItem(`user_${uid}`, JSON.stringify(updated));
    }
  }
};

// Chat Persistence (Local Storage for Demo)
export const saveChatHistory = async (uid: string, messages: ChatMessage[]): Promise<void> => {
  try {
    // Ideally this would go to a subcollection in Firestore 'users/{uid}/chats'
    // For this demo, we use localStorage to keep it simple and functional without full backend setup
    localStorage.setItem(`chat_history_${uid}`, JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save chat history", error);
  }
};

export const getChatHistory = async (uid: string): Promise<ChatMessage[]> => {
  try {
    const history = localStorage.getItem(`chat_history_${uid}`);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Failed to load chat history", error);
    return [];
  }
};