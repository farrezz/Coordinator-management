import { doc, getDoc, setDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, firebaseStorage } from "./firebase.js";

export const storage = {
  async get(key) {
    const snap = await getDoc(doc(db, "appData", key));
    if (!snap.exists()) throw new Error("not found");
    return { value: snap.data().value };
  },
  async set(key, value) {
    await setDoc(doc(db, "appData", key), { value });
  },
  subscribe(key, callback) {
    return onSnapshot(doc(db, "appData", key), (snap) => {
      callback(snap.exists() ? { value: snap.data().value } : null);
    });
  },
  async adjust(key, updater) {
    const docRef = doc(db, "appData", key);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      const current = snap.exists() ? JSON.parse(snap.data().value) : null;
      tx.set(docRef, { value: JSON.stringify(updater(current)) });
    });
  },
  async uploadImage(file) {
    const r = ref(firebaseStorage, `backgrounds/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  },
};
