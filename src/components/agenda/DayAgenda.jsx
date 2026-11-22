import { Text } from "@mantine/core";
import dayjs from "dayjs";
import { Empty, PersonAvatar } from "../ui";
import { PROCEDURE_LABEL } from "../../lib/status";

// The API has no duration, so every block is drawn as one slot.
const SLOT_MIN = 30;
const DEFAULT_START = 7;
const DEFAULT_END = 20;

const minutesOfDay = (d) => d.hour() * 60 + d.minute();

// Timeline with one row per vet. CANCELLED appointments free the slot, so
// they are not drawn.
export default function DayAgenda({ vets, appointments }) {
  const visible = appointments.filter((a) => a.status !== "CANCELLED");

  const hours = visible.map((a) => dayjs(a.dateTime).hour());
  const start = Math.min(DEFAULT_START, ...hours);
  const end = Math.max(DEFAULT_END, ...hours.map((h) => h + 1));
  const span = (end - start) * 60;
  const pct = (min) => `${((min - start * 60) / span) * 100}%`;

  if (vets.length === 0) return <Empty>Nenhum veterinário cadastrado.</Empty>;

  return (
    <div className="ag-scroll">
      <div className="ag">
        <div className="ag-row ag-head">
          <div className="ag-vet faint">Veterinário</div>
          <div className="ag-track">
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
        </div>

        {vets.map((vet) => {
          const mine = visible.filter((a) => a.vet.id === vet.id);
          return (
            <div className="ag-row" key={vet.id}>
              <div className="ag-vet">
                <PersonAvatar name={vet.name} size={32} />
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {vet.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {mine.length} {mine.length === 1 ? "consulta" : "consultas"}
                  </Text>
                </div>
              </div>
              <div className="ag-track">
                {Array.from({ length: end - start }, (_, i) => (
                  <span
                    key={i}
                    className="ag-gridline"
                    style={{ left: pct((start + i) * 60) }}
                  />
                ))}
                {mine.map((a) => {
                  const d = dayjs(a.dateTime);
                  return (
                    <div
                      key={a.id}
                      className={`ag-block ${a.status}`}
                      style={{
                        left: pct(minutesOfDay(d)),
                        width: `${(SLOT_MIN / span) * 100}%`,
                      }}
                      title={`${d.format("HH:mm")} · ${a.pet.name} · ${PROCEDURE_LABEL[a.type]}`}
                    >
                      <span className="ag-time">{d.format("HH:mm")}</span>
                      <span className="ag-pet">{a.pet.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
