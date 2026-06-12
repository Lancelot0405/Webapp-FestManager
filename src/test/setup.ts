import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

// Khởi động MSW server trước tất cả tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
// Reset handlers sau mỗi test (tránh state leak giữa tests)
afterEach(() => server.resetHandlers());
// Đóng server sau tất cả tests
afterAll(() => server.close());

// Mock window.matchMedia if not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
