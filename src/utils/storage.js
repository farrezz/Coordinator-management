import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

export const storage = {
  async get(key) {
    const snap = await getDoc(doc(db, "appData", key));
    if (!snap.exists()) throw new Error("not found");
    return { value: snap.data().value };
  },
  async set(key, value) {
    await setDoc(doc(db, "appData", key), { value });
  },
};
