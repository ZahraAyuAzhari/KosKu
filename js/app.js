// Logika tampilan: menggabungkan auth.js (login) dan db.js (data), lalu menggambar halaman.
import {$, esc, rp, daysTo, fmtD, waNum, terbilang, toast, today, plusMonth, ymd, BLN} from "./util.js";
import {initAuth, logout} from "./auth.js";
import * as DB from "./db.js";

const S = {profil: null, kamar: [], bayar: [], biaya: []};
let uid = null, unsubs = [], editing = null, filter = "semua", armed = null, asked = false;

const isLate = r => r.status === "terisi" && daysTo(r.jatuhTempo) !== null && daysTo(r.jatuhTempo) < 0;
const sumM = (a, ym) => a.filter(x => (x.tgl || "").startsWith(ym)).reduce((t, x) => t + (+x.jumlah || 0), 0);
const sortFn = s => (a, b) => s === "murah" ? a.harga - b.harga : s === "mahal" ? b.harga - a.harga
  : s === "tempo" ? (daysTo(a.jatuhTempo) ?? 9e9) - (daysTo(b.jatuhTempo) ?? 9e9)
  : String(a.no).localeCompare(String(b.no), "id", {numeric: true});

/* ===== Sesi: tampilkan login atau aplikasi ===== */
initAuth(u => {
  unsubs.forEach(f => f()); unsubs = [];
  uid = u ? u.uid : null; asked = false;
  S.profil = null; S.kamar = []; S.bayar = []; S.biaya = [];
  $("auth").hidden = !!u; $("app").hidden = !u;
  ["dlg", "pdlg", "ldlg"].forEach(i => $(i).open && $(i).close());
  if (!u) return;
  unsubs = DB.watch(uid, (n, v) => {
    if (n === "error") return toast("Gagal memuat data: " + v);
    S[n] = v; render();
    if (n === "profil" && !asked && !v.nama) { asked = true; openProfil() }
  });
});

/* ===== Tampilan ===== */
function render() {
  const p = S.profil || {};
  document.title = (p.nama || "KosKu") + " – KosKu";
  $("kosName").textContent = p.nama || "KosKu";
  $("kosAddr").textContent = p.nama ? `${p.alamat} • Pemilik: ${p.pemilik}${p.wa ? " • WA " + p.wa : ""}` : "Isi profil kos lewat tombol Profil kos";
  const all = S.kamar, q = $("q").value.trim().toLowerCase();
  const kosong = all.filter(r => r.status === "kosong"), isi = all.filter(r => r.status === "terisi");
  const sum = a => a.reduce((t, r) => t + (+r.harga || 0), 0);
  const pct = all.length ? Math.round(isi.length / all.length * 100) : 0, late = all.filter(isLate).length;
  const ym = today().slice(0, 7), masuk = sumM(S.bayar, ym), keluar = sumM(S.biaya, ym), laba = masuk - keluar;
  const dep = isi.reduce((t, r) => t + (+r.deposit || 0), 0);
  $("stats").innerHTML =
    `<div class="stat"><b>${all.length}</b><span>Total kamar</span></div>` +
    `<div class="stat free"><b>${kosong.length}</b><span>Kamar kosong</span></div>` +
    `<div class="stat"><b>${pct}%</b><span>Tingkat hunian</span><div class="bar"><i style="width:${pct}%"></i></div></div>` +
    `<div class="stat"><b>${rp(sum(isi))}</b><span>Potensi pemasukan per bulan</span></div>` +
    `<div class="stat"><b>${rp(sum(kosong))}</b><span>Potensi hilang karena kosong</span></div>` +
    `<div class="stat"><b>${rp(dep)}</b><span>Deposit ditahan</span></div>` +
    `<div class="stat"><b>${rp(masuk)}</b><span>Pemasukan bulan ini</span></div>` +
    `<div class="stat"><b${laba < 0 ? ' style="color:var(--late)"' : ""}>${rp(laba)}</b><span>Laba bersih bulan ini</span></div>` +
    `<div class="stat"><b${late ? ' style="color:var(--late)"' : ""}>${late}</b><span>Pembayaran terlambat</span></div>`;
  reminders();
  const list = all.filter(r => (filter === "semua" || (filter === "telat" ? isLate(r) : r.status === filter)) &&
    (!q || [r.no, r.tipe, r.catatan, r.penghuni, ...(r.fasilitas || [])].join(" ").toLowerCase().includes(q))).sort(sortFn($("sort").value));
  $("list").innerHTML = list.length ? list.map(card).join("") :
    `<div class="empty"><b>${all.length ? "Tidak ada kamar yang cocok." : "Belum ada kamar."}</b><br>${all.length ? "Ubah kata pencarian atau filter." : "Tekan Tambah kamar untuk mencatat kamar pertamamu."}</div>`;
}
function card(r) {
  const late = isLate(r), cls = r.status === "kosong" ? "kosong" : (late ? "telat" : "terisi"), d = daysTo(r.jatuhTempo);
  let due = "";
  if (r.status === "terisi") {
    due = d === null ? `<div class="due">Penghuni: ${esc(r.penghuni || "-")}</div>` :
      `<div class="due" style="color:var(--${late ? "late" : "busy"})">${esc(r.penghuni || "Penghuni")} • ${late ? "terlambat " + (-d) + " hari" : d === 0 ? "jatuh tempo hari ini" : "jatuh tempo " + d + " hari lagi"}</div>`;
    if (r.tglMasuk || r.deposit) due += `<div class="note">${r.tglMasuk ? "Masuk " + fmtD(r.tglMasuk) : ""}${r.tglMasuk && r.deposit ? " • " : ""}${r.deposit ? "Deposit " + rp(r.deposit) : ""}</div>`;
  }
  const b = (a, t, x = "") => `<button class="btn sm ${x}" data-a="${a}" data-id="${r.id}">${t}</button>`;
  return `<article class="room ${cls}"><div class="tag"><b>${esc(r.no)}</b><span>${r.status === "kosong" ? "KOSONG" : late ? "TELAT" : "TERISI"}</span></div><div class="body">
  <h3>${esc(r.tipe)}</h3><div class="price">${rp(r.harga)} / bulan</div>
  <div class="fas">${(r.fasilitas || []).map(f => `<em>${esc(f)}</em>`).join("")}</div>
  ${r.catatan ? `<p class="note">Catatan: ${esc(r.catatan)}</p>` : ""}${due}
  <div class="acts">${b("toggle", r.status === "kosong" ? "Tandai terisi" : "Tandai kosong")}${r.status === "terisi" && r.jatuhTempo ? b("paid", "Sudah bayar") : ""}${b("hist", "Riwayat")}${b("edit", "Ubah")}${b("del", armed === r.id ? "Yakin hapus?" : "Hapus", "danger")}</div></div></article>`;
}
// Pengingat: penghuni yang sudah lewat atau jatuh tempo dalam 3 hari. Dihitung ulang setiap data berubah.
function reminders() {
  const p = S.profil || {};
  const list = S.kamar.filter(r => r.status === "terisi" && daysTo(r.jatuhTempo) !== null && daysTo(r.jatuhTempo) <= 3)
    .sort((a, b) => daysTo(a.jatuhTempo) - daysTo(b.jatuhTempo));
  $("remind").hidden = !list.length;
  $("remind").innerHTML = list.length ? `<h2>Pengingat tagihan (${list.length})</h2>` + list.map(r => {
    const d = daysTo(r.jatuhTempo);
    const msg = `Halo ${r.penghuni || ""}, pembayaran ${p.nama || "kos"} kamar ${r.no} sebesar ${rp(r.harga)} ${d < 0 ? "sudah melewati" : "akan jatuh tempo pada"} ${fmtD(r.jatuhTempo)}. Terima kasih.`;
    return `<div class="rm"><span>Kamar ${esc(r.no)} • ${esc(r.penghuni || "-")} • ${d < 0 ? "terlambat " + (-d) + " hari" : d === 0 ? "jatuh tempo hari ini" : "jatuh tempo " + d + " hari lagi"}</span>
    ${r.waPenghuni ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(r.waPenghuni)}?text=${encodeURIComponent(msg)}">Kirim WA</a>` : `<small>No. WA belum diisi</small>`}</div>`;
  }).join("") : "";
}

/* ===== Kamar ===== */
const syncOcc = () => { $("occAll").style.display = $("fStatus").value === "terisi" ? "block" : "none" };
function openForm(r) {
  editing = r ? r.id : null;
  $("dtitle").textContent = r ? "Ubah kamar " + r.no : "Tambah kamar";
  $("fNo").value = r ? r.no : ""; $("fTipe").value = r ? r.tipe : "Standar"; $("fHarga").value = r ? r.harga : "";
  $("fStatus").value = r ? r.status : "kosong"; $("fFas").value = r ? (r.fasilitas || []).join(", ") : "";
  $("fPeng").value = r?.penghuni || ""; $("fWaP").value = r?.waPenghuni || ""; $("fMasuk").value = r?.tglMasuk || "";
  $("fDep").value = r?.deposit || ""; $("fDue").value = r?.jatuhTempo || ""; $("fCat").value = r?.catatan || "";
  syncOcc(); $("dlg").showModal(); $("fNo").focus();
}
async function saveForm() {
  const no = $("fNo").value.trim(), harga = parseInt($("fHarga").value, 10);
  if (!no) return toast("Isi nomor kamar dulu");
  if (isNaN(harga) || harga < 0) return toast("Isi harga per bulan dengan angka");
  if (S.kamar.some(r => r.no.toLowerCase() === no.toLowerCase() && r.id !== editing)) return toast("Nomor kamar " + no + " sudah ada");
  const st = $("fStatus").value, id = editing || DB.newKamarId(uid), ter = st === "terisi";
  const d = {no, tipe: $("fTipe").value, harga, status: st, catatan: $("fCat").value.trim(),
    fasilitas: $("fFas").value.split(",").map(x => x.trim()).filter(Boolean),
    penghuni: ter ? $("fPeng").value.trim() : "", waPenghuni: ter ? $("fWaP").value.trim() : "",
    tglMasuk: ter ? $("fMasuk").value : "", deposit: ter ? (parseInt($("fDep").value, 10) || 0) : 0,
    jatuhTempo: ter ? $("fDue").value : ""};
  try { await DB.saveKamar(uid, id, d); $("dlg").close(); toast("Kamar " + no + " disimpan") }
  catch (e) { toast("Gagal menyimpan: " + (e.code || e.message)) }
}
$("list").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const r = S.kamar.find(x => x.id === b.dataset.id), a = b.dataset.a; if (!r) return;
  if (a !== "del") armed = null;
  try {
    if (a === "edit") return openForm(r);
    if (a === "hist") return showHist(r);
    if (a === "del") {
      if (armed !== r.id) { armed = r.id; render(); setTimeout(() => { if (armed === r.id) { armed = null; render() } }, 3000); return }
      armed = null; await DB.delKamar(uid, r.id); toast("Kamar dihapus");
    }
    if (a === "toggle") {
      const wasFree = r.status === "kosong";
      await DB.patchKamar(uid, r.id, wasFree ? {status: "terisi"} :
        {status: "kosong", penghuni: "", waPenghuni: "", tglMasuk: "", deposit: 0, jatuhTempo: ""});
      toast(wasFree ? "Kamar " + r.no + " ditandai terisi. Tekan Ubah untuk isi data penghuni." :
        "Kamar " + r.no + " ditandai kosong" + (r.deposit ? ". Jangan lupa kembalikan deposit " + rp(r.deposit) : ""));
    }
    if (a === "paid") { await DB.catatBayar(uid, r, plusMonth(r.jatuhTempo)); toast("Pembayaran dicatat, jatuh tempo digeser sebulan") }
  } catch (err) { toast("Gagal: " + (err.code || err.message)) }
});

/* ===== Dialog umum: riwayat, kuitansi, laporan, pengeluaran ===== */
function openL(t, h) { $("lt").textContent = t; $("lb").innerHTML = h; if (!$("ldlg").open) $("ldlg").showModal() }
function showHist(r) {
  const h = S.bayar.filter(x => x.kid === r.id).sort((a, b) => b.tgl.localeCompare(a.tgl));
  openL("Riwayat pembayaran kamar " + r.no, h.length ? `<ul class="lst">${h.map(x =>
    `<li><span>${fmtD(x.tgl)} • ${esc(x.penghuni || "-")}</span><span><b>${rp(x.jumlah)}</b> <button class="btn sm" data-rc="${x.id}">Kuitansi</button></span></li>`).join("")}</ul>`
    : `<p class="note">Belum ada pembayaran tercatat. Tekan Sudah bayar pada kamar ini untuk mencatat.</p>`);
}
function receipt(x) {
  const p = S.profil || {}, no = "KW-" + x.tgl.replace(/-/g, "") + "-" + x.id.slice(0, 4).toUpperCase();
  return `<div class="rcp"><h2>KUITANSI PEMBAYARAN</h2><p class="rn">${esc(p.nama || "")} • No. ${no}</p><table>
  <tr><td>Telah terima dari</td><td>: ${esc(x.penghuni || "-")}</td></tr>
  <tr><td>Untuk pembayaran</td><td>: Sewa kamar ${esc(x.no)}${x.periode ? " (jatuh tempo " + fmtD(x.periode) + ")" : ""}</td></tr>
  <tr><td>Uang sejumlah</td><td>: <b>${rp(x.jumlah)}</b></td></tr>
  <tr><td>Terbilang</td><td>: <i>${terbilang(x.jumlah) || "nol"} rupiah</i></td></tr></table>
  <div class="sg">${fmtD(x.tgl)}<br><br><br><b>${esc(p.pemilik || "")}</b></div></div>`;
}
function showLap() {
  const now = new Date(), rows = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1), ym = ymd(d).slice(0, 7);
    rows.push({l: BLN[d.getMonth()] + " " + String(d.getFullYear()).slice(2), i: sumM(S.bayar, ym), e: sumM(S.biaya, ym)});
  }
  const mx = Math.max(1, ...rows.flatMap(r => [r.i, r.e])), tI = rows.reduce((t, r) => t + r.i, 0), tE = rows.reduce((t, r) => t + r.e, 0);
  openL("Laporan 6 bulan terakhir", `<div class="rep">${rows.map(r => `<div class="rr"><span>${r.l}</span><div><i class="bi" style="width:${r.i / mx * 100}%"></i><i class="be" style="width:${r.e / mx * 100}%"></i></div><small>${rp(r.i - r.e)}</small></div>`).join("")}</div>
  <p class="note"><span class="dot in"></span>Pemasukan ${rp(tI)} <span class="dot ex"></span>Pengeluaran ${rp(tE)}<br><b>Laba bersih: ${rp(tI - tE)}</b></p>
  <p class="small">Pemasukan dihitung dari tombol Sudah bayar. Angka di sisi kanan adalah laba per bulan.</p>
  <button class="btn sm" id="csv">Ekspor pembayaran (CSV)</button>`);
}
function showBiaya() {
  const h = [...S.biaya].sort((a, b) => b.tgl.localeCompare(a.tgl)).slice(0, 30);
  openL("Pengeluaran kos", `<div class="row2"><label class="f">Keterangan<input id="bKet" placeholder="mis. listrik, perbaikan keran"></label><label class="f">Jumlah (Rp)<input id="bJml" type="number" min="0" step="1000"></label></div>
  <label class="f">Tanggal<input id="bTgl" type="date" value="${today()}"></label>
  <button class="btn primary sm" id="bAdd">Catat pengeluaran</button>
  <ul class="lst">${h.map(x => `<li><span>${fmtD(x.tgl)} • ${esc(x.ket)}</span><span><b>${rp(x.jumlah)}</b> <button class="btn sm danger" data-bdel="${x.id}">Hapus</button></span></li>`).join("") || '<li class="note">Belum ada pengeluaran.</li>'}</ul>`);
}
function exportCsv() {
  const q = s => { s = String(s == null ? "" : s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"' };
  const csv = ["Tanggal,Kamar,Penghuni,Jumlah", ...S.bayar.map(x => [x.tgl, q(x.no), q(x.penghuni), x.jumlah].join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv"})); a.download = "kosku-pembayaran.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("lb").addEventListener("click", async e => {
  const t = e.target;
  try {
    if (t.id === "bAdd") {
      const ket = $("bKet").value.trim(), j = parseInt($("bJml").value, 10), tgl = $("bTgl").value;
      if (!ket || isNaN(j) || j < 0 || !tgl) return toast("Isi keterangan, jumlah, dan tanggal");
      await DB.addBiaya(uid, {tgl, ket, jumlah: j}); showBiaya(); toast("Pengeluaran dicatat");
    }
    if (t.dataset.bdel) { await DB.delBiaya(uid, t.dataset.bdel); showBiaya() }
    if (t.id === "csv") exportCsv();
    if (t.dataset.rc) {
      const x = S.bayar.find(y => y.id === t.dataset.rc); if (!x) return;
      openL("Kuitansi", receipt(x) + `<div class="dact"><button class="btn primary" id="print">Cetak kuitansi</button></div>`);
      $("print").onclick = () => { $("printArea").innerHTML = receipt(x); window.print() };
    }
  } catch (err) { toast("Gagal: " + (err.code || err.message)) }
});

/* ===== Profil, salin info, tema, tombol ===== */
function openProfil() {
  const p = S.profil || {};
  $("pKos").value = p.nama || ""; $("pAlamat").value = p.alamat || ""; $("pPemilik").value = p.pemilik || ""; $("pWa").value = p.wa || "";
  $("pdlg").showModal();
}
$("pSave").onclick = async () => {
  const nama = $("pKos").value.trim(), alamat = $("pAlamat").value.trim(), pemilik = $("pPemilik").value.trim();
  if (!nama || !alamat || !pemilik) return toast("Nama kos, alamat, dan nama pemilik wajib diisi");
  try { await DB.saveProfil(uid, {nama, alamat, pemilik, wa: $("pWa").value.trim()}); $("pdlg").close(); toast("Profil kos disimpan") }
  catch (e) { toast("Gagal menyimpan profil: " + (e.code || e.message)) }
};
$("share").onclick = () => {
  const k = S.kamar.filter(r => r.status === "kosong"), p = S.profil;
  if (!p || !p.nama) return toast("Isi profil kos dulu");
  if (!k.length) return toast("Semua kamar sedang terisi");
  const t = `${p.nama.toUpperCase()}\n${p.alamat}\n\nKAMAR KOSONG\n\n` + k.map(r => `Kamar ${r.no} (${r.tipe}) – ${rp(r.harga)}/bulan\nFasilitas: ${(r.fasilitas || []).join(", ") || "-"}`).join("\n\n") + `\n\nHubungi ${p.pemilik}${p.wa ? " di WhatsApp " + p.wa : ""} untuk survei kamar.`;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Info kamar kosong disalin"), () => toast("Gagal menyalin, salin manual saja"));
};
$("theme").onclick = () => {
  const h = document.documentElement, dark = h.dataset.theme === "dark" || (!h.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  h.dataset.theme = dark ? "light" : "dark"; try { localStorage.setItem("kosku:theme", h.dataset.theme) } catch (e) {}
};
try { const th = localStorage.getItem("kosku:theme"); if (th) document.documentElement.dataset.theme = th } catch (e) {}
$("profil").onclick = openProfil; $("pCancel").onclick = () => $("pdlg").close();
$("add").onclick = () => openForm(null); $("cancel").onclick = () => $("dlg").close(); $("save").onclick = saveForm;
$("fStatus").onchange = syncOcc; $("lap").onclick = showLap; $("biayaBtn").onclick = showBiaya; $("lx").onclick = () => $("ldlg").close();
$("logout").onclick = logout; $("q").oninput = render; $("sort").onchange = render;
$("chips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if (!c) return;
  filter = c.dataset.f; [...$("chips").children].forEach(x => x.setAttribute("aria-pressed", x === c)); render();
});

/* ===== Tombol lihat/sembunyikan password di halaman login ===== */
$("pwT").onclick = () => {
  const show = $("aPass").type === "password";
  [$("aPass"), $("aPass2")].forEach(i => i.type = show ? "text" : "password");
  $("pwT").textContent = show ? "Sembunyi" : "Lihat";
  $("pwT").setAttribute("aria-pressed", show);
};
