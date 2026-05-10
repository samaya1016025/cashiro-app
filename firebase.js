import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZBOgd5K1HGdl-r3EZpyp6PRZ33qIn9Cc",
  authDomain: "cashiro-app.firebaseapp.com",
  projectId: "cashiro-app",
  storageBucket: "cashiro-app.firebasestorage.app",
  messagingSenderId: "102189360578",
  appId: "1:102189360578:web:1776dfd22fa82ca2ac225b",
  measurementId: "G-XPY90GYMKQ"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const provider = new GoogleAuthProvider();

export async function loginGoogle() {
  try {
    await signInWithRedirect(auth, provider);
    return null;
  } catch(e) {
    console.error(e);
    return null;
  }
}

export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch(e) {
    console.error(e);
    return null;
  }
}

export async function logoutGoogle() {
  await signOut(auth);
}

export function onUserChange(callback) {
  onAuthStateChanged(auth, callback);
}

export async function guardarDato(userId, coleccion, id, data) {
  try {
    await setDoc(doc(db, 'usuarios', userId, coleccion, String(id)), data);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

export async function obtenerColeccion(userId, coleccion) {
  try {
    const snap = await getDocs(collection(db, 'usuarios', userId, coleccion));
    return snap.docs.map(d => d.data());
  } catch(e) {
    console.error(e);
    return [];
  }
}

export async function eliminarDato(userId, coleccion, id) {
  try {
    await deleteDoc(doc(db, 'usuarios', userId, coleccion, String(id)));
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

export { auth, db };