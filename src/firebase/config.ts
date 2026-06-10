import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyALTMvhQKcG-a-2WMJt49vljRqGtG4Z4oU",
  authDomain: "skillup-v2-4cc74.firebaseapp.com",
  projectId: "skillup-v2-4cc74",
  storageBucket: "skillup-v2-4cc74.firebasestorage.app",
  messagingSenderId: "528619171641",
  appId: "1:528619171641:web:68d4d9b1aa1ea2e1f142e8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
