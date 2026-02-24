/* ============================================================
   DATE UTILS - ESTÁNDAR GLOBAL SIN TIMEZONE
   Todas las fechas deben trabajar en formato YYYY-MM-DD
============================================================ */

/**
 * Devuelve YYYY-MM-DD sin aplicar timezone
 */
export const normalizeDate = (dateString?: string | null): string => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

/**
 * Formato argentino DD/MM/YYYY
 */
export const formatDateAR = (dateString?: string | null): string => {
  const normalized = normalizeDate(dateString);
  if (!normalized) return "";

  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Devuelve true si la fecha es hoy
 */
export const isToday = (dateString?: string | null): boolean => {
  const today = new Date().toISOString().split("T")[+3];
  return normalizeDate(dateString) === today;
};

/**
 * Comparaciones seguras sin timezone
 */
export const isOnOrAfter = (date: string, compareTo: string): boolean => {
  return normalizeDate(date) >= compareTo;
};

export const isOnOrBefore = (date: string, compareTo: string): boolean => {
  return normalizeDate(date) <= compareTo;
};
