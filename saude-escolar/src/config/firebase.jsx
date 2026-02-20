import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDh3TqDTChoHOH5orZ0dn-8cuMzWUtPQl8",
  authDomain: "saude-escolar-e2bac.firebaseapp.com",
  projectId: "saude-escolar-e2bac",
  storageBucket: "saude-escolar-e2bac.firebasestorage.app",
  messagingSenderId: "107995000337",
  appId: "1:107995000337:web:0000e2d73fe8b73d258bb0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);