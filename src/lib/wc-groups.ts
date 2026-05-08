/**
 * WC2026 group draw — code FIFA 3 lettres → lettre du groupe (A..L).
 * Tirage officiel effectué le 5 décembre 2025 à Washington.
 * Utilisé en fallback tant que BSD n'expose pas /standings/ pour le tournoi.
 */
export const WC2026_GROUPS: Record<string, string> = {
  // Groupe A
  MEX: "A", RSA: "A", KOR: "A", CZE: "A",
  // Groupe B
  CAN: "B", BIH: "B", QAT: "B", SUI: "B",
  // Groupe C
  BRA: "C", MAR: "C", HAI: "C", SCO: "C",
  // Groupe D
  USA: "D", PAR: "D", AUS: "D", TUR: "D",
  // Groupe E
  GER: "E", CUW: "E", CIV: "E", ECU: "E",
  // Groupe F
  NED: "F", JPN: "F", SWE: "F", TUN: "F",
  // Groupe G
  BEL: "G", EGY: "G", IRN: "G", NZL: "G",
  // Groupe H
  ESP: "H", CPV: "H", KSA: "H", URU: "H",
  // Groupe I
  FRA: "I", SEN: "I", IRQ: "I", NOR: "I",
  // Groupe J
  ARG: "J", ALG: "J", AUT: "J", JOR: "J",
  // Groupe K
  POR: "K", COD: "K", UZB: "K", COL: "K",
  // Groupe L
  ENG: "L", CRO: "L", PAN: "L", GHA: "L",
};

export function groupForCode(code: string): string {
  return WC2026_GROUPS[code?.toUpperCase()] ?? "";
}
