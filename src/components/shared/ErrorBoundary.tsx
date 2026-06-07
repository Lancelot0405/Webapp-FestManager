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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="font-bold text-gray-800 text-lg">Đã xảy ra lỗi</h2>
            <p className="text-sm text-gray-500">{this.state.error?.message ?? 'Lỗi không xác định'}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
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
