import { Dash } from "./Dash";

// Par chave/valor para fichas e detalhes
export function Facts({ items }) {
  return (
    <div className="facts">
      {items.map(([k, v]) => (
        <div className="fact" key={k}>
          <div className="k">{k}</div>
          <div className="v">{v ?? <Dash />}</div>
        </div>
      ))}
    </div>
  );
}
