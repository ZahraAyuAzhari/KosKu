// Login, daftar, keluar, dan reset password memakai Firebase Authentication.
import {onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail}
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {auth, configured} from "./firebase.js";
import {saveProfil} from "./db.js";
import {$} from "./util.js";

const MSG = {
  "auth/invalid-credential": "Email atau password salah.", "auth/wrong-password": "Email atau password salah.",
  "auth/user-not-found": "Email belum terdaftar.", "auth/email-already-in-use": "Email sudah terdaftar. Coba masuk.",
  "auth/invalid-email": "Format email belum benar.", "auth/weak-password": "Password minimal 6 karakter.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti."
};
let registerMode = false;
const err = m => { $("aErr").textContent = m };

function mode() {
  document.querySelectorAll(".reg").forEach(e => e.hidden = !registerMode);
  $("authTitle").textContent = registerMode ? "Buat akun pemilik kos" : "Masuk ke KosKu";
  $("authBtn").textContent = registerMode ? "Daftar dan masuk" : "Masuk";
  $("swMode").textContent = registerMode ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar";
  $("reset").hidden = registerMode; err("");
}
async function submit() {
  if (!configured) return err("Firebase belum diisi. Baca README.md langkah 4.");
  const em = $("aUser").value.trim(), pw = $("aPass").value;
  try {
    if (registerMode) {
      const nm = $("aNama").value.trim();
      if (!nm || !em) return err("Lengkapi nama pemilik dan email.");
      if (pw.length < 6) return err("Password minimal 6 karakter.");
      if (pw !== $("aPass2").value) return err("Ulangi password dengan isi yang sama.");
      const c = await createUserWithEmailAndPassword(auth, em, pw);
      await saveProfil(c.user.uid, {pemilik: nm});
    } else await signInWithEmailAndPassword(auth, em, pw);
    $("aPass").value = ""; $("aPass2").value = ""; err("");
  } catch (e) { err(MSG[e.code] || "Gagal: " + (e.code || e.message)) }
}
export function initAuth(onUser) {
  $("authBtn").onclick = submit;
  $("auth").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT") submit() });
  $("swMode").onclick = () => { registerMode = !registerMode; mode() };
  $("reset").onclick = async () => {
    const em = $("aUser").value.trim();
    if (!em) return err("Isi email dulu, lalu tekan tombol ini lagi.");
    try { await sendPasswordResetEmail(auth, em); err("Email reset password sudah dikirim. Cek kotak masuk atau spam.") }
    catch (e) { err(MSG[e.code] || "Gagal: " + (e.code || e.message)) }
  };
  mode();
  if (!configured) { onUser(null); err("Firebase belum diisi. Baca README.md langkah 4."); return }
  onAuthStateChanged(auth, onUser);
}
export const logout = () => signOut(auth);
