import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      // Persist to localStorage
      try {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to save user to localStorage:', e);
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      // Clear from localStorage
      try {
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Failed to clear user from localStorage:', e);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    initAuth: (state) => {
      // Try to load user from localStorage
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          state.user = JSON.parse(savedUser);
          state.isAuthenticated = true;
        }
      } catch (e) {
        console.error('Failed to load user from localStorage:', e);
      }
      state.loading = false;
    }
  }
});

export const { setUser, clearUser, setLoading, setError, initAuth } = authSlice.actions;
export default authSlice.reducer;
