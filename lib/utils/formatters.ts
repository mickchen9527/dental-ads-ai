function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    currency: "CNY",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(safeNumber(value));
}

export function formatInteger(value: number) {
  return Math.round(safeNumber(value)).toLocaleString("zh-CN");
}

export function formatRate(value: number) {
  return `${(safeNumber(value) * 100).toFixed(1)}%`;
}

export function formatRoi(value: number) {
  return safeNumber(value).toFixed(1);
}

export function formatScore(value: number) {
  return `${Math.round(safeNumber(value))}分`;
}
