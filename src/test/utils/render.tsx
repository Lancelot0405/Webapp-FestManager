import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import type { AppContextValue } from '../../context/AppContext';
import { mockAppContextValue } from '../mocks/fixtures';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  contextOverrides?: Partial<AppContextValue>;
  initialRoute?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  { contextOverrides = {}, initialRoute = '/', ...renderOptions }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient();
  const contextValue = { ...mockAppContextValue, ...contextOverrides };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={contextValue}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="*" element={children} />
            </Routes>
          </MemoryRouter>
        </AppContext.Provider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
