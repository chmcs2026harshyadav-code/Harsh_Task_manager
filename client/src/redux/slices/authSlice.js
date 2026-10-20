import { createSlice } from "@reduxjs/toolkit";

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const readUser = () => {
  try {
    const raw = read("userInfo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: readUser(),
  isSidebarOpen: false,
  theme: read("theme") === "dark" ? "dark" : "light",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      write("userInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      write("userInfo", null);
    },
    setOpenSidebar: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      write("theme", state.theme);
    },
  },
});

export const { setCredentials, logout, setOpenSidebar, toggleTheme } =
  authSlice.actions;

export default authSlice.reducer;
