export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeDomainInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}
