import dayjs from "dayjs";
import { Empty } from "../ui";
import { PROCEDURE_LABEL } from "../../lib/status";

// The API has no duration, so every block is drawn as one slot.
const SLOT_MIN = 30;
// blocks are at least this wide, so two starting closer than this overlap
const LANE_WINDOW_MIN = 90;
const DEFAULT_START = 7;
const DEFAULT_END = 20;

const minutesOfDay = (d) => d.hour() * 60 + d.minute();

// Puts each appointment in the first lane that is free at its start time.
function withLanes(appointments) {
  const laneEnds = [];
  const placed = appointments.map((a) => {
    const start = minutesOfDay(dayjs(a.dateTime));
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = start + LANE_WINDOW_MIN;
    return { ...a, lane };
  });
  return { placed, lanes: Math.max(laneEnds.length, 1) };
}

// One timeline with every vet's appointments together. CANCELLED appointments
// free the slot, so they are not drawn.
export default function DayAgenda({ appointments }) {
  const visible = appointments
    .filter((a) => a.status !== "CANCELLED")
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  if (visible.length === 0) {
    return <Empty>Nenhuma consulta neste dia.</Empty>;
  }

  const hours = visible.map((a) => dayjs(a.dateTime).hour());
  const start = Math.min(DEFAULT_START, ...hours);
  const end = Math.max(DEFAULT_END, ...hours.map((h) => h + 1));
  const span = (end - start) * 60;
  const pct = (min) => `${((min - start * 60) / span) * 100}%`;
  const { placed, lanes } = withLanes(visible);

  return (
    <div className="ag-scroll">
      <div className="ag">
        <div className="ag-head">
          {Array.from({ length: end - start }, (_, i) => (
            <span
              key={i}
              className="ag-hour"
              style={{ left: pct((start + i) * 60) }}
            >
              {start + i}h
            </span>
          ))}
        </div>
        <div className="ag-track" style={{ "--lanes": lanes }}>
          {Array.from({ length: end - start }, (_, i) => (
            <span
              key={i}
              className="ag-gridline"
              style={{ left: pct((start + i) * 60) }}
            />
          ))}
          {placed.map((a) => {
            const d = dayjs(a.dateTime);
            return (
              <div
                key={a.id}
                className={`ag-block ${a.status}`}
                style={{
                  left: pct(minutesOfDay(d)),
                  width: `${(SLOT_MIN / span) * 100}%`,
                  "--lane": a.lane,
                }}
                title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]} · ${a.vet.name}`}
              >
                <span className="ag-pet">
                  {d.format("HH:mm")} {a.pet.name}
                </span>
                <span className="ag-vet-name">{a.vet.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
