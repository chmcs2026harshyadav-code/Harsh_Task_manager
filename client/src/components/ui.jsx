import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STAGE_DOT,
  STAGE_LABEL,
  STAGE_STYLE,
  getInitials,
} from "../utils";

export const Spinner = ({ className }) => (
  <FaSpinner className={clsx("animate-spin", className)} />
);

export const PageLoader = () => (
  <div className='flex items-center justify-center py-24 text-indigo-600'>
    <Spinner className='text-3xl' />
  </div>
);

export const EmptyState = ({ icon, title, text, children }) => (
  <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
    {icon && (
      <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'>
        {icon}
      </div>
    )}
    <p className='text-base font-semibold'>{title}</p>
    {text && <p className='muted mt-1 max-w-sm text-sm'>{text}</p>}
    {children && <div className='mt-4'>{children}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
    <div>
      <h1 className='text-2xl font-extrabold tracking-tight'>{title}</h1>
      {subtitle && <p className='muted mt-0.5 text-sm'>{subtitle}</p>}
    </div>
    <div className='flex flex-wrap items-center gap-2'>{children}</div>
  </div>
);

export const StageBadge = ({ stage }) => (
  <span className={clsx("badge", STAGE_STYLE[stage])}>
    <span className={clsx("h-1.5 w-1.5 rounded-full", STAGE_DOT[stage])} />
    {STAGE_LABEL[stage] || stage}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={clsx("badge", PRIORITY_STYLE[priority])}>
    {PRIORITY_LABEL[priority] || priority}
  </span>
);

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-sky-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-teal-600",
];

export const Avatar = ({ name, size = "h-8 w-8 text-xs", className }) => {
  const i = (String(name || "?").charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return (
    <span
      title={name}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white dark:ring-[#141a29]",
        AVATAR_COLORS[i],
        size,
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
};

export const AvatarStack = ({ users = [], max = 3 }) => (
  <div className='flex -space-x-2'>
    {users.slice(0, max).map((u) => (
      <Avatar key={u._id} name={u.name} />
    ))}
    {users.length > max && (
      <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 ring-2 ring-white dark:bg-slate-700 dark:text-slate-200 dark:ring-[#141a29]'>
        +{users.length - max}
      </span>
    )}
  </div>
);

export const Field = ({ label, error, hint, children }) => (
  <div className='w-full'>
    {label && <label className='label'>{label}</label>}
    {children}
    {hint && !error && <p className='muted mt-1 text-xs'>{hint}</p>}
    {error && <p className='mt-1 text-xs font-medium text-rose-500'>{error}</p>}
  </div>
);

export const Modal = ({ open, onClose, title, children, size = "max-w-lg" }) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as='div' className='relative z-50' onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter='ease-out duration-200'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='ease-in duration-150'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm' />
      </Transition.Child>

      <div className='fixed inset-0 overflow-y-auto'>
        <div className='flex min-h-full items-center justify-center p-4'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-200'
            enterFrom='opacity-0 translate-y-3 scale-95'
            enterTo='opacity-100 translate-y-0 scale-100'
            leave='ease-in duration-150'
            leaveFrom='opacity-100 scale-100'
            leaveTo='opacity-0 scale-95'
          >
            <Dialog.Panel
              className={clsx(
                "card w-full p-6 text-left shadow-2xl",
                size
              )}
            >
              <div className='mb-4 flex items-start justify-between gap-4'>
                <Dialog.Title className='text-lg font-extrabold'>{title}</Dialog.Title>
                <button type='button' onClick={onClose} className='icon-btn -mr-2 -mt-1 h-8 w-8'>
                  <MdClose size={20} />
                </button>
              </div>
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size='max-w-md'>
    <p className='muted text-sm'>{message}</p>
    <div className='mt-6 flex justify-end gap-2'>
      <button type='button' className='btn btn-secondary' onClick={onClose}>
        Cancel
      </button>
      <button
        type='button'
        disabled={loading}
        className={clsx("btn", danger ? "btn-danger" : "btn-primary")}
        onClick={onConfirm}
      >
        {loading && <Spinner />}
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

// full screen image viewer
export const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div
      className='fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4'
      onClick={onClose}
    >
      <button className='absolute right-4 top-4 text-3xl text-white' onClick={onClose}>
        <MdClose />
      </button>
      <img
        src={src}
        alt='preview'
        className='max-h-full max-w-full rounded-lg object-contain'
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export const ImageGrid = ({ images = [], onRemove }) => {
  const [view, setView] = useState(null);
  if (!images.length) return null;
  return (
    <>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {images.map((src, i) => (
          <div key={src + i} className='group relative'>
            <img
              src={src}
              alt={`attachment ${i + 1}`}
              onClick={() => setView(src)}
              className='h-28 w-full cursor-zoom-in rounded-lg border border-slate-200 object-cover transition hover:opacity-90 dark:border-[#2d3750]'
            />
            {onRemove && (
              <button
                type='button'
                onClick={() => onRemove(i)}
                className='absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600'
              >
                <MdClose size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Lightbox src={view} onClose={() => setView(null)} />
    </>
  );
};
