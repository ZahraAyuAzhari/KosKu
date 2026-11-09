// Semua akses Firestore ada di sini. Data setiap pemilik berada di bawah owners/{uid}.
import {collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, updateDoc, writeBatch}
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {db} from "./firebase.js";
import {today} from "./util.js";

const col = (uid, n) => collection(db, "owners", uid, n);
const ref = (uid, n, id) => doc(db, "owners", uid, n, id);

// Pantau data secara realtime. cb(nama, data) dipanggil setiap ada perubahan.
export function watch(uid, cb) {
  const fail = e => cb("error", e.code);
  return [
    onSnapshot(doc(db, "owners", uid), s => cb("profil", s.exists() ? s.data() : {}), fail),
    ...["kamar", "bayar", "biaya"].map(n =>
      onSnapshot(col(uid, n), s => cb(n, s.docs.map(d => ({id: d.id, ...d.data()}))), fail))
  ];
}
export const saveProfil = (uid, p) => setDoc(doc(db, "owners", uid), p, {merge: true});
export const newKamarId = uid => doc(col(uid, "kamar")).id;
export const saveKamar = (uid, id, d) => setDoc(ref(uid, "kamar", id), d);
export const patchKamar = (uid, id, p) => updateDoc(ref(uid, "kamar", id), p);
export const delKamar = (uid, id) => deleteDoc(ref(uid, "kamar", id));
export const addBiaya = (uid, d) => addDoc(col(uid, "biaya"), d);
export const delBiaya = (uid, id) => deleteDoc(ref(uid, "biaya", id));
// Catat pembayaran sekaligus geser jatuh tempo. Batch memastikan keduanya berhasil atau gagal bersamaan.
export async function catatBayar(uid, r, tempoBaru) {
  const b = writeBatch(db);
  b.set(doc(col(uid, "bayar")), {kid: r.id, no: r.no, penghuni: r.penghuni || "", tgl: today(), jumlah: +r.harga || 0, periode: r.jatuhTempo});
  b.update(ref(uid, "kamar", r.id), {jatuhTempo: tempoBaru});
  await b.commit();
}
