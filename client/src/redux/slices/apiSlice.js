import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";

// Localhost: VITE_API_URL khali -> "/api" Vite proxy se server tak jaata hai
// Render: VITE_API_URL = https://tera-server.onrender.com (bina last "/" ke)
const API_URL = import.meta.env.VITE_API_URL || "";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  credentials: "include",
});

// if the server says "not logged in" (cookie expired / account disabled) -> log out in the UI
const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args?.url || "";

  if (result.error?.status === 401 && !url.includes("/user/login")) {
    api.dispatch(logout());
  }
  return result;
};

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["Task", "Dashboard", "Notice", "User"],
  endpoints: () => ({}),
});
