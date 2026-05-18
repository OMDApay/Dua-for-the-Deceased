import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaCSL9JL5V11Y0mJJrRF-NcuPfSYMTLs0",
  authDomain: "focal-highlander-pq7jp.firebaseapp.com",
  projectId: "focal-highlander-pq7jp",
  storageBucket: "focal-highlander-pq7jp.firebasestorage.app",
  messagingSenderId: "842524725707",
  appId: "1:842524725707:web:d10f9a7883d00b94a5a64e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Update user seen status in firestore
    await setDoc(doc(db, "users", user.uid), {
      lastSeen: serverTimestamp(),
      displayName: user.displayName,
      email: user.email
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the login popup.");
      return null;
    }
    console.error("Login Error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
