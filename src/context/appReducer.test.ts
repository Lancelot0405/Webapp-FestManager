import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from './appReducer';

describe('appReducer — auth', () => {
  it('LOGIN gán currentUser và tắt loading', () => {
    const s = appReducer(initialState, { type: 'LOGIN', payload: { id: 'u1', name: 'Admin', role: 'admin' } });
    expect(s.currentUser).toEqual({ id: 'u1', name: 'Admin', role: 'admin' });
    expect(s.loading).toBe(false);
  });

  it('LOGOUT xóa currentUser và tắt loading', () => {
    const logged = appReducer(initialState, { type: 'LOGIN', payload: { id: 'u1', name: 'Admin', role: 'admin' } });
    const s = appReducer(logged, { type: 'LOGOUT' });
    expect(s.currentUser).toBeNull();
    expect(s.loading).toBe(false);
  });

  it('SET_LOADING cập nhật loading flag', () => {
    const s = appReducer(initialState, { type: 'SET_LOADING', payload: false });
    expect(s.loading).toBe(false);
  });

  it('action lạ → trả nguyên state', () => {
    // @ts-expect-error test action không tồn tại
    expect(appReducer(initialState, { type: 'UNKNOWN' })).toBe(initialState);
  });

  it('không đột biến state gốc', () => {
    const snapshot = JSON.stringify(initialState);
    appReducer(initialState, { type: 'LOGIN', payload: { id: 'u1', name: 'Admin', role: 'admin' } });
    expect(JSON.stringify(initialState)).toBe(snapshot);
  });
});
