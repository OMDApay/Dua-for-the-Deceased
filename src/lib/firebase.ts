import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.projectId);
export const googleProvider = new GoogleAuthProvider();

let isLoggingIn = false;

export const loginWithGoogle = async () => {
  if (isLoggingIn) return null;
  isLoggingIn = true;
  
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
      alert("⚠️ يرجى السماح بالنوافذ المنبثقة في متصفحك أو فتح التطبيق في نافذة جديدة (أعلى اليسار).");
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed it, no need for a big alert unless they keep failing
      console.log("Popup closed by user");
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      const projectId = firebaseConfig.projectId;
      alert(`⚠️ خطأ في الإعدادات:

النطاق الحالي [ ${currentDomain} ] يحتاج للتصريح في مشروع Firebase.

⚠️ تأكد أنك تستخدم مشروع: [ ${projectId} ]

الحل:
1- ادخل لوحة تحكم Firebase لمشروع [ ${projectId} ].
2- اذهب لـ Authentication -> Settings -> Authorized Domains.
3- أضف هذا النطاق: ${currentDomain}`);
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Ignore
    } else {
      alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
    }
  } finally {
    isLoggingIn = false;
  }
  return null;
};

export const logout = () => signOut(auth);
