import { PROCEDURE_COLOR, PROCEDURE_LABEL } from "@/lib/status";

export const typeLabel = (type) => PROCEDURE_LABEL[type] ?? type;
export const typeColor = (type) => PROCEDURE_COLOR[type] ?? "gray";
