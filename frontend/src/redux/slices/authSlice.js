import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { disconnectSocket } from '../../services/socket.js';

const stored = localStorage.getItem('auth');
const initial = stored ? JSON.parse(stored) : { user: null, accessToken: null, refreshToken: null };

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { ...initial, loading: false, error: null },
  reducers: {
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('auth', JSON.stringify({
        user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken,
      }));
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('auth', JSON.stringify({
        user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken,
      }));
    },
    logout: (state) => {
      state.user = null; state.accessToken = null; state.refreshToken = null;
      localStorage.removeItem('auth');
      disconnectSocket();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('auth', JSON.stringify({
          user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken,
        }));
      })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('auth', JSON.stringify({
          user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken,
        }));
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('auth', JSON.stringify({
          user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken,
        }));
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setTokens, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
