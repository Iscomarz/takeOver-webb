/**
 * Genera un slug amigable para URLs a partir de un texto.
 * Ejemplo: "Halloween Party 2026!" -> "halloween-party-2026"
 * 
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Separa caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos/diacríticos
    .trim()
    .replace(/\s+/g, "-") // Reemplaza espacios con guiones
    .replace(/[^\w\-]+/g, "") // Elimina caracteres especiales
    .replace(/\-\-+/g, "-"); // Evita múltiples guiones seguidos
}
