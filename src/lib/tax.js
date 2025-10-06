// src/lib/tax.js
export const PPN_RATE = 0.11;

/** Hitung DPP & PPN dari total yang SUDAH include PPN */
export function splitPPNFromGross(gross, rate = PPN_RATE) {
  const dpp = Math.round(gross / (1 + rate));
  const ppn = Math.round(gross - dpp);
  return { dpp, ppn };
}

/** Hitung PPN dari total yang BELUM include PPN */
export function addPPNFromNet(net, rate = PPN_RATE) {
  const ppn = Math.round(net * rate);
  const gross = net + ppn;
  return { net, ppn, gross };
}
