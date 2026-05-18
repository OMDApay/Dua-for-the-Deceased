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
    if (result.user) {
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        lastSeen: serverTimestamp()
      }, { merge: true });
      return user;
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("يرجى السماح بالنوافذ المنبثقة في متصفحك أو فتح التطبيق في نافذة جديدة (أعلى اليسار).");
    } else if (error.code === 'auth/popup-closed-by-user') {
      alert("لقد قمت بإغلاق نافذة تسجيل الدخول قبل اكتمال العملية. يرجى المحاولة مرة أخرى.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Ignore parallel requests
    } else {
      alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
    }
  }
  return null;
};

export const logout = () => signOut(auth);
