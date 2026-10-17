export const MODES = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank transfer (NEFT/RTGS/IMPS)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];
export const modeLabel = Object.fromEntries(MODES.map((m) => [m.value, m.label]));
