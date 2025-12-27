import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ampi-fest.firebaseapp.com",
  projectId: "ampi-fest",
  storageBucket: "ampi-fest.appspot.com",
  messagingSenderId: "XXXXXXXX",
  appId: "XXXXXXXX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);