// import axios from 'axios';
// import { store } from '../redux/store.js';
// import { logout, setTokens } from '../redux/slices/authSlice.js';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || '/api',
//   withCredentials: true,
// });

// // Request interceptor — attach token
// api.interceptors.request.use((config) => {
//   const token = store.getState().auth.accessToken;
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // Response interceptor — refresh token on 401
// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       const refreshToken = store.getState().auth.refreshToken;
//       if (!refreshToken) {
//         store.dispatch(logout());
//         return Promise.reject(error);
//       }

//       try {
//         const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken });
//         const { accessToken, refreshToken: newRefreshToken } = data.data;
//         store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
//         processQueue(null, accessToken);
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (err) {
//         processQueue(err, null);
//         store.dispatch(logout());
//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// ✅ Request interceptor — attach token
api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth'));
  const token = auth?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Response interceptor — refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const auth = JSON.parse(localStorage.getItem('auth'));
      const refreshToken = auth?.refreshToken;

      if (!refreshToken) {
        localStorage.removeItem('auth');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // ✅ update localStorage
        localStorage.setItem('auth', JSON.stringify({
          ...auth,
          accessToken,
          refreshToken: newRefreshToken,
        }));

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('auth');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;