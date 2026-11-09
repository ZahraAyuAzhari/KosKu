// Inisialisasi Firebase satu kali, dipakai oleh auth.js dan db.js.
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

export const configured = !firebaseConfig.apiKey.startsWith("ISI");
const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app && getAuth(app);
export const db = app && getFirestore(app);
