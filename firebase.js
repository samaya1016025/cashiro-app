const firebaseConfig = {
  apiKey: "AIzaSyDZBOgd5K1HGdl-r3EZpyp6PRZ33qIn9Cc",
  authDomain: "cashiro-app.firebaseapp.com",
  projectId: "cashiro-app",
  storageBucket: "cashiro-app.firebasestorage.app",
  messagingSenderId: "102189360578",
  appId: "1:102189360578:web:1776dfd22fa82ca2ac225b"
};

firebase.initializeApp(firebaseConfig);
const auth     = firebase.auth();
const db       = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

async function loginGoogle() {
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch(e) {
    console.error('loginGoogle error:', e.code, e.message);
    return null;
  }
}

async function logoutGoogle() {
  await auth.signOut();
}

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    });
  });
}

async function guardarDato(userId, coleccion, id, data) {
  try {
    await db.collection('usuarios').doc(userId)
      .collection(coleccion).doc(String(id)).set(data);
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

async function obtenerColeccion(userId, coleccion) {
  try {
    const snap = await db.collection('usuarios').doc(userId)
      .collection(coleccion).get();
    return snap.docs.map(d => d.data());
  } catch(e) {
    console.error(e);
    return [];
  }
}

async function eliminarDato(userId, coleccion, id) {
  try {
    await db.collection('usuarios').doc(userId)
      .collection(coleccion).doc(String(id)).delete();
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

async function guardarPerfil(userId, data) {
  try {
    await db.collection('usuarios').doc(userId)
      .collection('perfil').doc('datos').set(data, { merge: true });
    return true;
  } catch(e) {
    console.error(e);
    return false;
  }
}

async function obtenerPerfil(userId) {
  try {
    const doc = await db.collection('usuarios').doc(userId)
      .collection('perfil').doc('datos').get();
    return doc.exists ? doc.data() : null;
  } catch(e) {
    console.error(e);
    return null;
  }
}