import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.projectId);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Track user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      lastSeen: serverTimestamp()
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed login popup");
      return null;
    }
    if (error.code === 'auth/popup-blocked') {
      alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك لتتمكن من تسجيل الدخول.");
    }
    console.error("Login Error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
