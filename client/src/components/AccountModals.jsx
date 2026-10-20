import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  useChangePasswordMutation,
  useUpdateUserMutation,
} from "../redux/slices/api/userApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { Field, Modal, Spinner } from "./ui";

export const ProfileModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    values: { name: user?.name || "", title: user?.title || "", role: user?.role || "" },
  });

  const onSubmit = async (form) => {
    try {
      const res = await updateUser(form).unwrap();
      dispatch(setCredentials({ ...user, ...res.user }));
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Could not update profile");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title='My Profile'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Field label='Full name' error={errors.name?.message}>
          <input className='input' {...register("name", { required: "Name is required" })} />
        </Field>
        <Field label='Job title' error={errors.title?.message}>
          <input className='input' {...register("title", { required: "Title is required" })} />
        </Field>
        <Field label='Role / Department' error={errors.role?.message}>
          <input className='input' {...register("role", { required: "Role is required" })} />
        </Field>
        <Field label='Email'>
          <input className='input opacity-60' value={user?.email || ""} disabled readOnly />
        </Field>
        <div className='flex justify-end gap-2 pt-2'>
          <button type='button' className='btn btn-secondary' onClick={onClose}>
            Cancel
          </button>
          <button type='submit' className='btn btn-primary' disabled={isLoading}>
            {isLoading && <Spinner />} Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ChangePasswordModal = ({ open, onClose }) => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async ({ currentPassword, password }) => {
    try {
      const res = await changePassword({ currentPassword, password }).unwrap();
      toast.success(res.message);
      close();
    } catch (err) {
      toast.error(err?.data?.message || "Could not change password");
    }
  };

  return (
    <Modal open={open} onClose={close} title='Change Password'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Field label='Current password' error={errors.currentPassword?.message}>
          <input
            type='password'
            className='input'
            {...register("currentPassword", { required: "Enter your current password" })}
          />
        </Field>
        <Field label='New password' error={errors.password?.message}>
          <input
            type='password'
            className='input'
            {...register("password", {
              required: "Enter a new password",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
        </Field>
        <Field label='Confirm new password' error={errors.confirm?.message}>
          <input
            type='password'
            className='input'
            {...register("confirm", {
              validate: (v) => v === watch("password") || "Passwords do not match",
            })}
          />
        </Field>
        <div className='flex justify-end gap-2 pt-2'>
          <button type='button' className='btn btn-secondary' onClick={close}>
            Cancel
          </button>
          <button type='submit' className='btn btn-primary' disabled={isLoading}>
            {isLoading && <Spinner />} Update password
          </button>
        </div>
      </form>
    </Modal>
  );
};
