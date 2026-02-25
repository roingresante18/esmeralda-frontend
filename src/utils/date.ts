import { format, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns/parseISO";

const ARG_TIMEZONE = "America/Argentina/Buenos_Aires";

export function formatArgentinaDate(
  date: string | Date,
  pattern = "dd/MM/yyyy HH:mm",
) {
  const zonedDate = toZonedTime(date, ARG_TIMEZONE);

  return format(zonedDate, pattern, {
    timeZone: ARG_TIMEZONE,
  });
}
// 🔥 Para fechas sin hora
export function formatDateOnlyAR(date?: string | null) {
  if (!date) return "Sin fecha";
  const parts = date.split("-");
  if (parts.length !== 3) return "Fecha inválida";

  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function formatDateTimeAR(date?: string | null) {
  if (!date) return "Sin fecha";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Fecha inválida";

  return d.toLocaleString("es-AR");
}
