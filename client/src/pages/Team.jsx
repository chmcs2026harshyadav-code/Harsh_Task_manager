import clsx from "clsx";
import { Switch } from "@headlessui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { MdEdit, MdLockReset, MdOutlineSearch } from "react-icons/md";
import { HiOutlineUsers } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Avatar, ConfirmDialog, EmptyState, Field, Modal, PageHeader, PageLoader, Spinner } from "../components/ui";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetTeamListsQuery,
  useResetPasswordMutation,
  useUpdateUserMutation,
  useUserActionMutation,
} from "../redux/slices/api/userApiSlice";

const UserForm = ({ person, onClose }) => {
  const editing = !!person;
  const { user: me } = useSelector((s) => s.auth);
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: person?.name || "",
      email: person?.email || "",
      title: person?.title || "",
      role: person?.role || "Employee",
      password: "",
      isAdmin: person?.isAdmin ? "admin" : "employee",
    },
  });

  const onSubmit = async (form) => {
    const body = { ...form, isAdmin: form.isAdmin === "admin" };
    try {
      const res = editing
        ? await updateUser({ ...body, _id: person._id }).unwrap()
        : await createUser(body).unwrap();
      toast.success(res.message || "User created successfully");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const busy = creating || updating;
  const isSelf = editing && person._id === me?._id;

  return (
    <Modal open onClose={onClose} title={editing ? "Edit user" : "Add new user"}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Field label='Full name' error={errors.name?.message}>
          <input className='input' {...register("name", { required: "Name is required" })} />
        </Field>

        <Field label='Email' error={errors.email?.message}>
          <input
            type='email'
            className={clsx("input", editing && "opacity-60")}
            disabled={editing}
            {...register("email", { required: !editing && "Email is required" })}
          />
        </Field>

        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Job title' error={errors.title?.message}>
            <input className='input' placeholder='e.g. Developer' {...register("title", { required: "Title is required" })} />
          </Field>
          <Field label='Role / Department' error={errors.role?.message}>
            <input className='input' placeholder='e.g. Employee' {...register("role", { required: "Role is required" })} />
          </Field>
        </div>

        <Field label='Account type' hint={isSelf ? "You can not change your own account type." : undefined}>
          <select className='input' disabled={isSelf} {...register("isAdmin")}>
            <option value='employee'>Employee (sees only own tasks)</option>
            <option value='admin'>Admin (full access)</option>
          </select>
        </Field>

        {!editing && (
          <Field label='Password' error={errors.password?.message} hint='Share this password with the user. They can change it later.'>
            <input
              type='text'
              autoComplete='off'
              className='input'
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
            />
          </Field>
        )}

        <div className='flex justify-end gap-2 pt-2'>
          <button type='button' className='btn btn-secondary' onClick={onClose}>Cancel</button>
          <button type='submit' className='btn btn-primary' disabled={busy}>
            {busy && <Spinner />} {editing ? "Save changes" : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ResetPasswordModal = ({ person, onClose }) => {
  const [reset, { isLoading }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      const res = await reset({ id: person._id, password }).unwrap();
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Could not reset password");
    }
  };

  return (
    <Modal open onClose={onClose} title={`Reset password · ${person.name}`} size='max-w-md'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Field label='New password' error={errors.password?.message}>
          <input
            type='text'
            autoComplete='off'
            className='input'
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
        </Field>
        <div className='flex justify-end gap-2'>
          <button type='button' className='btn btn-secondary' onClick={onClose}>Cancel</button>
          <button type='submit' className='btn btn-primary' disabled={isLoading}>
            {isLoading && <Spinner />} Reset password
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Team = () => {
  const { user: me } = useSelector((s) => s.auth);
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useGetTeamListsQuery({ search });
  const [userAction] = useUserActionMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const [form, setForm] = useState(undefined); // undefined closed, null new, user edit
  const [resetFor, setResetFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const toggleActive = async (u) => {
    try {
      const res = await userAction({ id: u._id, isActive: !u.isActive }).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Could not change status");
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await deleteUser(toDelete._id).unwrap();
      toast.success(res.message);
      setToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not delete user");
    }
  };

  return (
    <>
      <PageHeader title='Team' subtitle={`${users.length} user${users.length === 1 ? "" : "s"}`}>
        <button className='btn btn-primary' onClick={() => setForm(null)}>
          <FaPlus size={12} /> Add user
        </button>
      </PageHeader>

      <div className='card mb-4 p-3'>
        <div className='relative'>
          <MdOutlineSearch className='muted absolute left-3 top-1/2 -translate-y-1/2 text-lg' />
          <input className='input pl-9' placeholder='Search by name, email, title…' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <div className='card'>
          <EmptyState icon={<HiOutlineUsers />} title='No users found' />
        </div>
      ) : (
        <div className='card overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[860px]'>
              <thead>
                <tr>
                  <th className='th'>User</th>
                  <th className='th'>Title / Role</th>
                  <th className='th'>To do</th>
                  <th className='th'>In progress</th>
                  <th className='th'>Review</th>
                  <th className='th'>Done</th>
                  <th className='th'>Active</th>
                  <th className='th text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u._id === me?._id;
                  return (
                    <tr key={u._id} className={clsx("row", !u.isActive && "opacity-60")}>
                      <td className='td'>
                        <div className='flex items-center gap-3'>
                          <Avatar name={u.name} size='h-9 w-9 text-sm' />
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-bold'>
                              {u.name}{" "}
                              {u.isAdmin && (
                                <span className='badge ml-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'>Admin</span>
                              )}
                            </p>
                            <p className='muted truncate text-xs'>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className='td'>
                        <p className='text-sm'>{u.title}</p>
                        <p className='muted text-xs'>{u.role}</p>
                      </td>
                      <td className='td font-semibold'>{u.counts.todo}</td>
                      <td className='td font-semibold'>{u.counts.inProgress}</td>
                      <td className='td font-semibold'>{u.counts.submitted}</td>
                      <td className='td font-semibold'>{u.counts.completed}</td>
                      <td className='td'>
                        <Switch
                          checked={u.isActive}
                          disabled={self}
                          onChange={() => toggleActive(u)}
                          title={self ? "You can not disable yourself" : u.isActive ? "Disable account" : "Activate account"}
                          className={clsx(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50",
                            u.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition", u.isActive ? "translate-x-6" : "translate-x-1")} />
                        </Switch>
                      </td>
                      <td className='td'>
                        <div className='flex justify-end gap-1'>
                          <button className='icon-btn' title='Edit' onClick={() => setForm(u)}>
                            <MdEdit size={18} />
                          </button>
                          <button className='icon-btn' title='Reset password' onClick={() => setResetFor(u)}>
                            <MdLockReset size={20} />
                          </button>
                          <button
                            className='icon-btn hover:!text-rose-600 disabled:opacity-40'
                            title={self ? "You can not delete yourself" : "Delete user"}
                            disabled={self}
                            onClick={() => setToDelete(u)}
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form !== undefined && <UserForm person={form || undefined} onClose={() => setForm(undefined)} />}
      {resetFor && <ResetPasswordModal person={resetFor} onClose={() => setResetFor(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        danger
        title='Delete user?'
        message={`${toDelete?.name} will be deleted and removed from all tasks. To keep the history, disable the account instead.`}
        confirmLabel='Delete user'
      />
    </>
  );
};

export default Team;
