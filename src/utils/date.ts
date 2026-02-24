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
export function formatDateOnlyAR(date: string) {
  return format(parseISO(date), "dd/mM/yyyy");
}
export function formatDateTimeAR(date: string | Date) {
  const zonedDate = toZonedTime(date, ARG_TIMEZONE);

  return format(zonedDate, "dd/MM/yyyy HH:mm", {
    timeZone: ARG_TIMEZONE,
  });
}
