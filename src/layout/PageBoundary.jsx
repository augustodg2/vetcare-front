import { Button } from "@mantine/core";
import { Component, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Empty, LoadingRows } from "@/components/ui";

class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate({ resetKey }) {
    if (this.state.failed && resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Empty
        action={
          <Button
            variant="default"
            size="xs"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </Button>
        }
      >
        Não foi possível carregar esta página.
      </Empty>
    );
  }
}

export default function PageBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <PageErrorBoundary resetKey={pathname}>
      <Suspense fallback={<LoadingRows />}>{children}</Suspense>
    </PageErrorBoundary>
  );
}
