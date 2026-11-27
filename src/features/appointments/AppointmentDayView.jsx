import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { Empty } from "@/components/ui";
import { PROCEDURE_LABEL } from "@/lib/status";
import { cx } from "@/lib/cx";
import appointmentStyles from "./AppointmentBlock.module.css";
import styles from "./AppointmentDayView.module.css";

const SLOT_MIN = 30;
const DEFAULT_START = 7;
const DEFAULT_END = 20;
const SCROLL_OFFSET_PX = 24;

const minutesOfDay = (d) => d.hour() * 60 + d.minute();

function withLanes(appointments) {
  const laneEnds = [];
  const placed = appointments.map((a) => {
    const start = minutesOfDay(dayjs(a.dateTime));
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = start + SLOT_MIN;
    return { ...a, lane };
  });
  return { placed, lanes: Math.max(laneEnds.length, 1) };
}

export default function AppointmentDayView({ appointments, day, onSelect }) {
  const scrollRef = useRef(null);
  const visible = appointments
    .filter((a) => a.status !== "CANCELLED")
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const dayKey = day?.format("YYYY-MM-DD");
  const hasItems = visible.length > 0;

  useEffect(() => {
    const box = scrollRef.current;
    const anchor = box?.querySelector("[data-anchor]");
    if (anchor) box.scrollTop = anchor.offsetTop - SCROLL_OFFSET_PX;
  }, [dayKey, hasItems]);

  if (!hasItems) {
    return <Empty>Nenhuma consulta neste dia.</Empty>;
  }

  const hours = visible.map((a) => dayjs(a.dateTime).hour());
  const start = Math.min(DEFAULT_START, ...hours);
  const end = Math.max(DEFAULT_END, ...hours.map((h) => h + 1));
  const at = (hours, extraPx = 0) =>
    `calc(var(--hour) * ${hours} + ${extraPx}px)`;
  const px = (min, extraPx) => at((min - start * 60) / 60, extraPx);
  const { placed, lanes } = withLanes(visible);

  const now = dayjs();
  const nowMin = minutesOfDay(now);
  const showNow =
    day && now.isSame(day, "day") && nowMin >= start * 60 && nowMin < end * 60;

  return (
    <div className={styles.scroll} ref={scrollRef}>
      <div className={styles.timeline} style={{ height: at(end - start) }}>
        {Array.from({ length: end - start }, (_, i) => (
          <div
            key={i}
            className={styles.row}
            style={{ top: at(i), height: at(1) }}
          >
            <span className={styles.hour}>
              {String(start + i).padStart(2, "0")}:00
            </span>
          </div>
        ))}
        <div className={styles.track}>
          {placed.map((a) => {
            const d = dayjs(a.dateTime);
            return (
              <button
                type="button"
                key={a.id}
                data-anchor={!showNow && a === placed[0] ? "" : undefined}
                onClick={() => onSelect?.(a)}
                className={cx(
                  appointmentStyles.block,
                  appointmentStyles.inline,
                  a.status === "DONE" && appointmentStyles.done,
                )}
                style={{
                  top: px(minutesOfDay(d), 1),
                  height: at(SLOT_MIN / 60, -2),
                  left: `calc(${(a.lane / lanes) * 100}% + 2px)`,
                  width: `calc(${100 / lanes}% - 4px)`,
                }}
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
          {showNow && (
            <span
              className={styles.now}
              data-anchor=""
              style={{ top: px(nowMin) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
