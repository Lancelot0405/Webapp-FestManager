import { Component, type ReactNode } from 'react';

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
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="font-bold text-[var(--text-primary)] text-lg">Đã xảy ra lỗi</h2>
            <p className="text-sm text-[var(--text-muted)]">{this.state.error?.message ?? 'Lỗi không xác định'}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[var(--primary)] text-[var(--background)] font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
