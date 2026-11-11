// Fungsi bantu umum: format, tanggal, terbilang, notifikasi.
export const $ = id => document.getElementById(id);
export const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const rp = n => "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
const BLN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
export {BLN};
const pad = n => String(n).padStart(2, "0");
export const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const today = () => ymd(new Date());
export const fmtD = d => { if (!d) return "-"; const [y, m, t] = d.split("-"); return t + " " + BLN[m - 1] + " " + y };
// Selisih hari dari hari ini: negatif berarti sudah lewat.
export function daysTo(d) {
  if (!d) return null;
  const a = new Date(d + "T00:00:00"), b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 864e5);
}
export function plusMonth(d) { const x = new Date(d + "T00:00:00"); x.setMonth(x.getMonth() + 1); return ymd(x) }
export const waNum = n => { n = String(n || "").replace(/\D/g, ""); return n.startsWith("0") ? "62" + n.slice(1) : n };
// Angka menjadi kata, mis. 750000 -> "tujuh ratus lima puluh ribu".
export function terbilang(n) {
  const s = ["","satu","dua","tiga","empat","lima","enam","tujuh","delapan","sembilan","sepuluh","sebelas"];
  n = Math.floor(n);
  if (n < 12) return s[n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + terbilang(n % 10) : "");
  if (n < 200) return "seratus" + (n > 100 ? " " + terbilang(n - 100) : "");
  if (n < 1e3) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 2e3) return "seribu" + (n > 1e3 ? " " + terbilang(n - 1e3) : "");
  if (n < 1e6) return terbilang(Math.floor(n / 1e3)) + " ribu" + (n % 1e3 ? " " + terbilang(n % 1e3) : "");
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + " juta" + (n % 1e6 ? " " + terbilang(n % 1e6) : "");
  return terbilang(Math.floor(n / 1e9)) + " miliar" + (n % 1e9 ? " " + terbilang(n % 1e9) : "");
}
export function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2800);
}
