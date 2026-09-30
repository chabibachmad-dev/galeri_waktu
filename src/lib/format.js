export function formatMonthHeading(date) {
  return new Date(date).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTimeInput(date) {
  // Format "YYYY-MM-DDTHH:mm" -- dipakai sebagai value <input type="datetime-local">.
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
