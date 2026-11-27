import dayjs from "dayjs";
import { Dash } from "@/components/ui";
import { PROCEDURE_LABEL } from "@/lib/status";
import { cx } from "@/lib/cx";
import appointmentStyles from "./AppointmentBlock.module.css";
import styles from "./AppointmentWeekView.module.css";

export default function AppointmentWeekView({ appointments, start, onSelect }) {
  const visible = appointments.filter((a) => a.status !== "CANCELLED");
  const today = dayjs();

  return (
    <div className={styles.week}>
      {Array.from({ length: 7 }, (_, i) => {
        const day = start.add(i, "day");
        const items = visible
          .filter((a) => dayjs(a.dateTime).isSame(day, "day"))
          .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
        return (
          <div className={styles.day} key={i}>
            <div
              className={cx(
                styles.head,
                day.isSame(today, "day") && styles.today,
              )}
            >
              <span>{day.format("ddd")}</span>
              <span className={styles.date}>{day.format("D")}</span>
              <span className={styles.count}>{items.length || ""}</span>
            </div>
            <div className={styles.list}>
              {items.length === 0 && <Dash />}
              {items.map((a) => {
                const d = dayjs(a.dateTime);
                return (
                  <button
                    type="button"
                    key={a.id}
                    className={cx(
                      appointmentStyles.block,
                      appointmentStyles.card,
                      a.status === "DONE" && appointmentStyles.done,
                    )}
                    onClick={() => onSelect?.(a)}
                    title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]} · ${a.vet.name}`}
                  >
                    <span className={appointmentStyles.pet}>
                      {d.format("HH:mm")} {a.pet.name}
                    </span>
                    <span className={appointmentStyles.type}>
                      {PROCEDURE_LABEL[a.type]}
                    </span>
                    <span className={appointmentStyles.vet}>{a.vet.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
