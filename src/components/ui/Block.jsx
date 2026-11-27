import { Group } from "@mantine/core";

export function Block({
  title,
  sub,
  actions,
  children,
  flush,
  footer,
  className = "",
}) {
  return (
    <section className={`block ${className}`}>
      {(title || actions) && (
        <div className="block-head">
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {actions && (
            <Group gap="xs" wrap="wrap">
              {actions}
            </Group>
          )}
        </div>
      )}
      {flush ? children : <div className="block-body">{children}</div>}
      {footer && <div className="block-foot">{footer}</div>}
    </section>
  );
}
