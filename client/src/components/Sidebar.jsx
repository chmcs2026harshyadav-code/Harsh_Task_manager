import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";
import { FaTasks, FaTrashAlt, FaUsers } from "react-icons/fa";
import {
  MdClose,
  MdOutlineDashboard,
  MdOutlinePendingActions,
  MdOutlineRateReview,
  MdOutlineTimelapse,
  MdTaskAlt,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { useGetDasboardStatsQuery } from "../redux/slices/api/taskApiSlice";
import { setOpenSidebar } from "../redux/slices/authSlice";

const Brand = () => (
  <div className='flex items-center gap-3 px-5 py-5'>
    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'>
      <MdTaskAlt size={24} />
    </div>
    <div>
      <p className='text-lg font-extrabold leading-none'>TaskFlow</p>
      <p className='muted mt-1 text-[11px] font-medium'>Task Manager</p>
    </div>
  </div>
);

const SidebarContent = ({ onNavigate }) => {
  const { user } = useSelector((s) => s.auth);
  const { data } = useGetDasboardStatsQuery();
  const submitted = data?.tasks?.submitted || 0;

  const links = [
    { label: "Dashboard", to: "/dashboard", icon: <MdOutlineDashboard /> },
    { label: "All Tasks", to: "/tasks", icon: <FaTasks />, end: true },
    { label: "To Do", to: "/tasks/todo", icon: <MdOutlinePendingActions /> },
    { label: "In Progress", to: "/tasks/in-progress", icon: <MdOutlineTimelapse /> },
    {
      label: user?.isAdmin ? "Review Queue" : "Submitted",
      to: "/tasks/submitted",
      icon: <MdOutlineRateReview />,
      badge: user?.isAdmin ? submitted : 0,
    },
    { label: "Completed", to: "/tasks/completed", icon: <MdTaskAlt /> },
    { label: "Trash", to: "/trashed", icon: <FaTrashAlt /> },
  ];

  if (user?.isAdmin) {
    links.push({ label: "Team", to: "/team", icon: <FaUsers /> });
  }

  return (
    <div className='flex h-full flex-col'>
      <Brand />

      <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-2'>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              )
            }
          >
            <span className='text-lg'>{l.icon}</span>
            <span className='flex-1'>{l.label}</span>
            {l.badge > 0 && (
              <span className='rounded-full bg-violet-500 px-2 py-0.5 text-[11px] font-bold text-white'>
                {l.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className='m-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/5'>
        <p className='font-bold'>{user?.isAdmin ? "Admin panel" : "Employee panel"}</p>
        <p className='muted mt-0.5'>
          {user?.isAdmin
            ? "You can assign tasks, review work and manage the team."
            : "See your tasks, submit your work and track the status."}
        </p>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const { isSidebarOpen } = useSelector((s) => s.auth);
  const close = () => dispatch(setOpenSidebar(false));

  return (
    <>
      {/* desktop */}
      <aside className='fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white dark:border-[#232c3f] dark:bg-[#10162a] md:block'>
        <SidebarContent />
      </aside>

      {/* mobile */}
      <Transition show={isSidebarOpen} as={Fragment}>
        <Dialog as='div' className='relative z-50 md:hidden' onClose={close}>
          <Transition.Child
            as={Fragment}
            enter='transition-opacity duration-200'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='transition-opacity duration-150'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-slate-900/60' />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter='transition duration-200'
            enterFrom='-translate-x-full'
            enterTo='translate-x-0'
            leave='transition duration-150'
            leaveFrom='translate-x-0'
            leaveTo='-translate-x-full'
          >
            <Dialog.Panel className='fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#10162a]'>
              <button onClick={close} className='icon-btn absolute right-3 top-4'>
                <MdClose size={22} />
              </button>
              <SidebarContent onNavigate={close} />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
};

export default Sidebar;
