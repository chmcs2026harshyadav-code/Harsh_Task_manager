import { apiSlice } from "../apiSlice";

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeamLists: builder.query({
      query: ({ search = "" } = {}) =>
        `/user/get-team?search=${encodeURIComponent(search)}`,
      providesTags: ["User"],
    }),

    createUser: builder.mutation({
      query: (data) => ({ url: "/user/register", method: "POST", body: data }),
      invalidatesTags: ["User", "Dashboard"],
    }),

    updateUser: builder.mutation({
      query: (data) => ({ url: "/user/profile", method: "PUT", body: data }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({ url: `/user/${id}`, method: "DELETE" }),
      invalidatesTags: ["User", "Task", "Dashboard"],
    }),

    userAction: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: ["User", "Dashboard"],
    }),

    resetPassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/user/reset-password/${id}`,
        method: "PUT",
        body: { password },
      }),
    }),

    changePassword: builder.mutation({
      query: (data) => ({ url: "/user/change-password", method: "PUT", body: data }),
    }),

    getNotifications: builder.query({
      query: () => "/user/notifications",
      providesTags: ["Notice"],
    }),

    markNotiAsRead: builder.mutation({
      query: ({ type, id }) => ({
        url: `/user/read-noti?isReadType=${type}${id ? `&id=${id}` : ""}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notice"],
    }),
  }),
});

export const {
  useGetTeamListsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUserActionMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetNotificationsQuery,
  useMarkNotiAsReadMutation,
} = userApiSlice;
