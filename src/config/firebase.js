import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEu9gxPNySQYb38WTIiPQwylpAq-2zniE",
  authDomain: "notus-b5cf3.firebaseapp.com",
  projectId: "notus-b5cf3",
  storageBucket: "notus-b5cf3.firebasestorage.app",
  messagingSenderId: "907263182006",
  appId: "1:907263182006:web:2ae26b13ef9a91ae4f1217",
  measurementId: "G-ZWS1TKF5DP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
