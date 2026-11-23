import dayjs from "dayjs";
import { Dash } from "../ui";
import { PROCEDURE_LABEL } from "../../lib/status";

export default function WeekAgenda({ appointments, start, onSelect }) {
  const visible = appointments.filter((a) => a.status !== "CANCELLED");
  const today = dayjs();

  return (
    <div className="wk">
      {Array.from({ length: 7 }, (_, i) => {
        const day = start.add(i, "day");
        const items = visible
          .filter((a) => dayjs(a.dateTime).isSame(day, "day"))
          .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
        return (
          <div className="wk-day" key={i}>
            <div
              className={`wk-head ${day.isSame(today, "day") ? "today" : ""}`}
            >
              <span className="wk-dow">{day.format("ddd")}</span>
              <span className="wk-date">{day.format("D")}</span>
              <span className="wk-count">{items.length || ""}</span>
            </div>
            <div className="wk-list">
              {items.length === 0 && <Dash />}
              {items.map((a) => {
                const d = dayjs(a.dateTime);
                return (
                  <button
                    type="button"
                    key={a.id}
                    className={`ag-block wk-card ${a.status}`}
                    onClick={() => onSelect?.(a)}
                    title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]} · ${a.vet.name}`}
                  >
                    <span className="ag-pet">
                      {d.format("HH:mm")} {a.pet.name}
                    </span>
                    <span className="ag-vet-name">{a.vet.name}</span>
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
