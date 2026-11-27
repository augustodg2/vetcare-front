import dayjs from "dayjs";
import { PROCEDURE_LABEL } from "@/lib/status";
import { weekStart } from "@/lib/format";

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
    <div className="mo">
      <div className="mo-dows">
        {dows.map((d) => (
          <span key={d.day()}>{d.format("ddd")}</span>
        ))}
      </div>
      <div className="mo-grid">
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
              className={`mo-day${outside ? " outside" : ""}${items.length ? "" : " empty"}`}
            >
              <button
                type="button"
                className={`mo-date${day.isSame(today, "day") ? " today" : ""}`}
                onClick={() => onDay?.(day)}
                aria-label={day.format("dddd, D [de] MMMM")}
              >
                <span className="mo-dow">{day.format("ddd")}</span>
                <span className="mo-n">{day.format("D")}</span>
              </button>
              <div className="mo-list">
                {items.slice(0, MAX_ITEMS).map((a) => {
                  const d = dayjs(a.dateTime);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`mo-item ${a.status}`}
                      onClick={() => onSelect?.(a)}
                      title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]} · ${a.vet.name}`}
                    >
                      <span className="t">{d.format("HH:mm")}</span>
                      <span className="p">{a.pet.name}</span>
                    </button>
                  );
                })}
                {extra > 0 && (
                  <button
                    type="button"
                    className="mo-more"
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
        <p className="mo-none">Nenhuma consulta neste mês</p>
      )}
    </div>
  );
}
