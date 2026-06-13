import { Component, type ReactNode } from 'react';
import { Card, Button } from '@heroui/react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-sm w-full p-6 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="font-bold text-foreground text-lg">Đã xảy ra lỗi</h2>
            <p className="text-sm text-muted">{this.state.error?.message ?? 'Lỗi không xác định'}</p>
            <Button
              className="w-full"
              onPress={() => window.location.reload()}
            >
              Tải lại ứng dụng
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
