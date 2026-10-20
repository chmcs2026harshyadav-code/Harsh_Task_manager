import { apiSlice } from "../apiSlice";

const CHANGED = ["Task", "Dashboard", "Notice"];

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTask: builder.query({
      // params: { stage, priority, search, assignee, due, sort, isTrashed }
      query: (params = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") qs.set(k, v);
        });
        return `/task?${qs.toString()}`;
      },
      providesTags: ["Task"],
    }),

    getSingleTask: builder.query({
      query: (id) => `/task/${id}`,
      providesTags: ["Task"],
    }),

    getDasboardStats: builder.query({
      query: () => "/task/dashboard",
      providesTags: ["Dashboard", "Task"],
    }),

    // upload images to OUR server (server/uploads) - returns { urls: [...] }
    uploadImages: builder.mutation({
      query: (formData) => ({ url: "/task/upload", method: "POST", body: formData }),
    }),

    createTask: builder.mutation({
      query: (data) => ({ url: "/task/create", method: "POST", body: data }),
      invalidatesTags: CHANGED,
    }),

    updateTask: builder.mutation({
      query: (data) => ({ url: `/task/update/${data._id}`, method: "PUT", body: data }),
      invalidatesTags: CHANGED,
    }),

    duplicateTask: builder.mutation({
      query: (id) => ({ url: `/task/duplicate/${id}`, method: "POST", body: {} }),
      invalidatesTags: CHANGED,
    }),

    changeTaskStage: builder.mutation({
      query: ({ id, stage }) => ({
        url: `/task/change-stage/${id}`,
        method: "PUT",
        body: { stage },
      }),
      invalidatesTags: CHANGED,
    }),

    submitTask: builder.mutation({
      query: ({ id, note, images }) => ({
        url: `/task/submit/${id}`,
        method: "POST",
        body: { note, images },
      }),
      invalidatesTags: CHANGED,
    }),

    reviewTask: builder.mutation({
      query: ({ id, action, remark }) => ({
        url: `/task/review/${id}`,
        method: "PUT",
        body: { action, remark },
      }),
      invalidatesTags: CHANGED,
    }),

    postTaskActivity: builder.mutation({
      query: ({ id, activity }) => ({
        url: `/task/activity/${id}`,
        method: "POST",
        body: { activity },
      }),
      invalidatesTags: ["Task", "Notice"],
    }),

    createSubTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/task/create-subtask/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Task"],
    }),

    changeSubTaskStatus: builder.mutation({
      query: ({ id, subId, status }) => ({
        url: `/task/change-status/${id}/${subId}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Task"],
    }),

    trashTask: builder.mutation({
      query: (id) => ({ url: `/task/trash/${id}`, method: "PUT" }),
      invalidatesTags: CHANGED,
    }),

    deleteRestoreTask: builder.mutation({
      query: ({ id, actionType }) => ({
        url: `/task/delete-restore/${id || ""}?actionType=${actionType}`,
        method: "DELETE",
      }),
      invalidatesTags: CHANGED,
    }),
  }),
});

export const {
  useGetAllTaskQuery,
  useGetSingleTaskQuery,
  useGetDasboardStatsQuery,
  useUploadImagesMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDuplicateTaskMutation,
  useChangeTaskStageMutation,
  useSubmitTaskMutation,
  useReviewTaskMutation,
  usePostTaskActivityMutation,
  useCreateSubTaskMutation,
  useChangeSubTaskStatusMutation,
  useTrashTaskMutation,
  useDeleteRestoreTaskMutation,
} = taskApiSlice;
