import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineRemoveRedEye, MdTaskAlt, MdVisibilityOff } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Field, Spinner } from "../components/ui";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import { setCredentials } from "../redux/slices/authSlice";

const Login = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (user) navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setError("");
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials(res));
    } catch (err) {
      setError(err?.data?.message || "Cannot reach the server. Is the backend running?");
    }
  };

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      {/* brand side */}
      <div className='relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 text-white lg:flex'>
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur'>
            <MdTaskAlt size={26} />
          </div>
          <span className='text-xl font-extrabold'>TaskFlow</span>
        </div>

        <div>
          <h2 className='text-4xl font-extrabold leading-tight'>
            Assign. Track.
            <br />
            Review. Done.
          </h2>
          <p className='mt-4 max-w-md text-indigo-100'>
            One place for your team's work. Admins assign tasks and review the
            submitted work, employees update progress and submit proof with photos.
          </p>
          <ul className='mt-8 space-y-3 text-sm text-indigo-50'>
            {[
              "Role based access: admin & employee",
              "Priority, due dates and live status",
              "Photo proof, comments and activity timeline",
              "Trash & restore, only admin deletes forever",
            ].map((t) => (
              <li key={t} className='flex items-center gap-2'>
                <span className='flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs'>✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className='text-xs text-indigo-200'>© {new Date().getFullYear()} TaskFlow</p>

        <div className='pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10' />
        <div className='pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5' />
      </div>

      {/* form side */}
      <div className='flex items-center justify-center p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='card w-full max-w-md space-y-5 p-8'>
          <div>
            <h1 className='text-2xl font-extrabold'>Welcome back</h1>
            <p className='muted mt-1 text-sm'>Log in with the email and password given by your admin.</p>
          </div>

          {error && (
            <div className='rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'>
              {error}
            </div>
          )}

          <Field label='Email' error={errors.email?.message}>
            <input
              type='email'
              autoComplete='username'
              className='input'
              placeholder='you@company.com'
              {...register("email", { required: "Email is required" })}
            />
          </Field>

          <Field label='Password' error={errors.password?.message}>
            <div className='relative'>
              <input
                type={show ? "text" : "password"}
                autoComplete='current-password'
                className='input pr-10'
                placeholder='••••••••'
                {...register("password", { required: "Password is required" })}
              />
              <button
                type='button'
                onClick={() => setShow(!show)}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                aria-label='Show or hide password'
              >
                {show ? <MdVisibilityOff size={20} /> : <MdOutlineRemoveRedEye size={20} />}
              </button>
            </div>
          </Field>

          <button type='submit' disabled={isLoading} className='btn btn-primary w-full py-2.5'>
            {isLoading && <Spinner />} Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
