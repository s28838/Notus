import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTtSADv8FPfAgVZ402GMthevItJ9ZrXTI",
  authDomain: "notus-51108.firebaseapp.com",
  projectId: "notus-51108",
  storageBucket: "notus-51108.firebasestorage.app",
  messagingSenderId: "449765014282",
  appId: "1:449765014282:web:4e2b7f8b2cf3ed7ec2d8f3",
  measurementId: "G-ZBHELHN974"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
