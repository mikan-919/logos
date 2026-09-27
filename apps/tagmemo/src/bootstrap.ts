export function initialData() {
  if (typeof document === "undefined") return null;
  const element = document.getElementById("tagmemo-initial-data");
  if (!element) return null;
  try {
    return JSON.parse(element.textContent ?? "null");
  } catch {
    return null;
  }
}
