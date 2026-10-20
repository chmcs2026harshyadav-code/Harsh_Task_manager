import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/slices/api/taskApiSlice";
import { useGetTeamListsQuery } from "../../redux/slices/api/userApiSlice";
import { PRIORITIES, PRIORITY_LABEL, STAGES, STAGE_LABEL, dateFormatter } from "../../utils";
import ImagePicker, { useImageUpload } from "../ImagePicker";
import { Avatar, Field, Modal, Spinner } from "../ui";

// Create / edit a task.  Admin: can assign to any user.  Employee: task is for himself.
const TaskForm = ({ onClose, task }) => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = !!user?.isAdmin;
  const editing = !!task?._id;

  const { data: users = [] } = useGetTeamListsQuery({ search: "" }, { skip: !isAdmin });
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
  const [uploadFiles, uploading] = useImageUpload();

  const [team, setTeam] = useState((task?.team || []).map((t) => t._id || t));
  const [existing, setExisting] = useState(task?.assets || []);
  const [files, setFiles] = useState([]);
  const [teamError, setTeamError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: task?.title || "",
      date: dateFormatter(task?.date || new Date()),
      stage: task?.stage || "todo",
      priority: task?.priority || "normal",
      description: task?.description || "",
      links: (task?.links || []).join(", "),
    },
  });

  const stageOptions = isAdmin ? STAGES : ["todo", "in progress"];

  const toggleUser = (id) => {
    setTeamError("");
    setTeam((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  const onSubmit = async (form) => {
    if (isAdmin && team.length === 0) {
      return setTeamError("Select at least one user");
    }

    try {
      const newUrls = await uploadFiles(files);

      const payload = {
        ...form,
        assets: [...existing, ...newUrls],
        ...(isAdmin ? { team } : {}),
      };

      const res = editing
        ? await updateTask({ ...payload, _id: task._id }).unwrap()
        : await createTask(payload).unwrap();

      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const busy = creating || updating || uploading;

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={editing ? "Edit task" : "New task"}
      size='max-w-2xl'
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Field label='Title' error={errors.title?.message}>
          <input
            className='input'
            placeholder='e.g. Prepare monthly sales report'
            {...register("title", { required: "Title is required" })}
          />
        </Field>

        {isAdmin && (
          <Field label='Assign to' error={teamError}>
            <div className='max-h-44 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-300 dark:divide-[#1d2538] dark:border-[#2d3750]'>
              {users
                .filter((u) => u.isActive)
                .map((u) => (
                  <label
                    key={u._id}
                    className='flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5'
                  >
                    <input
                      type='checkbox'
                      className='h-4 w-4 accent-indigo-600'
                      checked={team.includes(u._id)}
                      onChange={() => toggleUser(u._id)}
                    />
                    <Avatar name={u.name} />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-semibold'>{u.name}</span>
                      <span className='muted block truncate text-xs'>
                        {u.title} {u.isAdmin ? "· Admin" : ""}
                      </span>
                    </span>
                  </label>
                ))}
              {users.length === 0 && (
                <p className='muted px-3 py-4 text-center text-sm'>No users yet. Add users from the Team page.</p>
              )}
            </div>
          </Field>
        )}

        <div className='grid gap-4 sm:grid-cols-3'>
          <Field label='Status'>
            <select className='input' {...register("stage")}>
              {stageOptions.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label='Priority'>
            <select className='input' {...register("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label='Due date' error={errors.date?.message}>
            <input
              type='date'
              className='input'
              {...register("date", { required: "Due date is required" })}
            />
          </Field>
        </div>

        <Field label='Description'>
          <textarea
            rows={3}
            className='input'
            placeholder='What needs to be done?'
            {...register("description")}
          />
        </Field>

        <Field label='Links' hint='Separate multiple links with a comma (,)'>
          <input className='input' placeholder='https://...' {...register("links")} />
        </Field>

        <Field label='Photos / attachments'>
          <ImagePicker
            files={files}
            setFiles={setFiles}
            existing={existing}
            onRemoveExisting={(i) => setExisting(existing.filter((_, idx) => idx !== i))}
          />
        </Field>

        <div className='flex justify-end gap-2 pt-2'>
          <button type='button' className='btn btn-secondary' onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type='submit' className='btn btn-primary' disabled={busy}>
            {busy && <Spinner />} {editing ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
