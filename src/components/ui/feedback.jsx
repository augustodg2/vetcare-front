import { Button, Skeleton, Stack, Text } from "@mantine/core";

export function Empty({ children, action }) {
  return (
    <div className="empty">
      <Text c="dimmed" size="sm">
        {children}
      </Text>
      {action}
    </div>
  );
}

export function LoadingRows({ rows = 4 }) {
  return (
    <Stack gap={12} p="md">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={16} width={`${90 - (i % 3) * 15}%`} />
      ))}
    </Stack>
  );
}

function ErrorState({ onRetry }) {
  return (
    <Empty
      action={
        onRetry && (
          <Button variant="default" size="xs" onClick={() => onRetry()}>
            Tentar de novo
          </Button>
        )
      }
    >
      Não foi possível carregar estas informações.
    </Empty>
  );
}

// Mostra carregando / erro / conteúdo de uma consulta do React Query
export function Async({ q, rows, fallback, children }) {
  if (q.error && q.data === undefined) {
    return <ErrorState onRetry={q.reload ?? q.refetch} />;
  }
  if (q.data === undefined) return fallback ?? <LoadingRows rows={rows} />;
  return children(q.data);
}
