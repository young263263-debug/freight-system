export function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(v: string | number | null | undefined) {
  const n = toNumber(v);
  return n.toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  });
}

export function formatNumber(v: string | number | null | undefined) {
  const n = toNumber(v);
  return n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
}

export function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(yearMonth: string) {
  // yearMonth: "YYYY-MM"
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}
