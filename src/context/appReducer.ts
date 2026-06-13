import type { CurrentUser } from '../types';

export interface AppState {
  currentUser: CurrentUser | null;
  loading:     boolean;
}

export const initialState: AppState = {
  currentUser: null,
  loading:     true,
};

export type Action =
  | { type: 'LOGIN';  payload: CurrentUser }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, currentUser: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}
