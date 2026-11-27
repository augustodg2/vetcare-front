import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export const ISO = "YYYY-MM-DD";
export const todayISO = () => dayjs().format(ISO);
export const toISO = (d) => (d ? dayjs(d).format(ISO) : null);

export const brl = (v) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const toCents = (v) => Math.round(Number(v || 0) * 100);

export const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");
export const fmtDateTime = (d) =>
  d ? dayjs(d).format("DD/MM/YYYY [às] HH:mm") : "—";

export function relDay(d) {
  const diff = dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff > 1 ? `em ${diff} dias` : `há ${-diff} dias`;
}

export function ago(d) {
  const day = dayjs(d).startOf("day");
  const today = dayjs().startOf("day");
  const days = today.diff(day, "day");
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = today.diff(day, "month");
  if (months < 12) return months <= 1 ? "há 1 mês" : `há ${months} meses`;
  const years = today.diff(day, "year");
  return years === 1 ? "há 1 ano" : `há ${years} anos`;
}

export function age(birth) {
  if (!birth) return "—";
  const years = dayjs().diff(birth, "year");
  if (years >= 1) return `${years} ${years === 1 ? "ano" : "anos"}`;
  const months = Math.max(dayjs().diff(birth, "month"), 0);
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}

export const kg = (w) =>
  w == null || w === ""
    ? "—"
    : `${Number(w).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;

export const initials = (name = "") =>
  name
    .replace(/^(Dra?\.)\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export const onlyDigits = (v = "") => v.replace(/\D/g, "");

export function maskCpf(v = "") {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isCpf(v = "") {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

// CRMV number (up to 6 digits) + UF -> "CRMV-SP 123456"
export const formatCrmv = (number, uf) => `CRMV-${uf} ${number}`;

// 123.456.789-10 -> 123.***.***-10
export function hideCpf(v = "") {
  const d = onlyDigits(v);
  return d.length === 11 ? `${d.slice(0, 3)}.***.***-${d.slice(9)}` : "";
}

export function maskPhone(v = "") {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// primeiro dia (segunda) da semana de uma data
export const weekStart = (d) => {
  const day = dayjs(d).startOf("day");
  return day.subtract((day.day() + 6) % 7, "day");
};
