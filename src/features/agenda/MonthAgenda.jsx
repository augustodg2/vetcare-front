import dayjs from "dayjs";
import { PROCEDURE_LABEL } from "@/lib/status";
import { weekStart } from "@/lib/format";
import { cx } from "@/lib/cx";
import styles from "./MonthAgenda.module.css";

const MAX_ITEMS = 3;

export default function MonthAgenda({ appointments, month, onSelect, onDay }) {
  const visible = appointments
    .filter((a) => a.status !== "CANCELLED")
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const today = dayjs();
  const start = weekStart(month.startOf("month"));
  const weeks = Math.ceil((month.endOf("month").diff(start, "day") + 1) / 7);
  const dows = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));

  return (
    <div className={styles.month}>
      <div className={styles.weekdays}>
        {dows.map((d) => (
          <span key={d.day()}>{d.format("ddd")}</span>
        ))}
      </div>
      <div className={styles.grid}>
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const day = start.add(i, "day");
          const items = visible.filter((a) =>
            dayjs(a.dateTime).isSame(day, "day"),
          );
          const outside = !day.isSame(month, "month");
          const extra = items.length - MAX_ITEMS;
          return (
            <div
              key={i}
              className={cx(
                styles.day,
                outside && styles.outside,
                !items.length && styles.empty,
              )}
            >
              <button
                type="button"
                className={cx(
                  styles.date,
                  day.isSame(today, "day") && styles.today,
                )}
                onClick={() => onDay?.(day)}
                aria-label={day.format("dddd, D [de] MMMM")}
              >
                <span className={styles.weekday}>{day.format("ddd")}</span>
                <span className={styles.number}>{day.format("D")}</span>
              </button>
              <div className={styles.list}>
                {items.slice(0, MAX_ITEMS).map((a) => {
                  const d = dayjs(a.dateTime);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={cx(
                        styles.item,
                        a.status === "DONE" && styles.done,
                      )}
                      onClick={() => onSelect?.(a)}
                      title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]} · ${a.vet.name}`}
                    >
                      <span className={styles.time}>{d.format("HH:mm")}</span>
                      <span className={styles.pet}>{a.pet.name}</span>
                    </button>
                  );
                })}
                {extra > 0 && (
                  <button
                    type="button"
                    className={styles.more}
                    onClick={() => onDay?.(day)}
                  >
                    +{extra} {extra === 1 ? "consulta" : "consultas"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!visible.some((a) => dayjs(a.dateTime).isSame(month, "month")) && (
        <p className={styles.none}>Nenhuma consulta neste mês</p>
      )}
    </div>
  );
}
