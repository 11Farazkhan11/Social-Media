import { createSlice } from '@reduxjs/toolkit';

const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState: { darkMode: savedTheme === 'dark', createPostOpen: false, searchOpen: false },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    },
    setCreatePostOpen: (state, action) => { state.createPostOpen = action.payload; },
    setSearchOpen: (state, action) => { state.searchOpen = action.payload; },
  },
});

export const { toggleDarkMode, setCreatePostOpen, setSearchOpen } = uiSlice.actions;
export default uiSlice.reducer;
