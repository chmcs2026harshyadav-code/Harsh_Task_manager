import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { MdKeyboardArrowDown, MdLockOutline, MdMenu, MdPersonOutline } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiSlice } from "../redux/slices/apiSlice";
import { useLogoutMutation } from "../redux/slices/api/authApiSlice";
import { logout, setOpenSidebar, toggleTheme } from "../redux/slices/authSlice";
import { ChangePasswordModal, ProfileModal } from "./AccountModals";
import NotificationPanel from "./NotificationPanel";
import { Avatar } from "./ui";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, theme } = useSelector((s) => s.auth);
  const [logoutApi] = useLogoutMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      /* even if the call fails, clear the local session */
    }
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate("/log-in");
  };

  const itemClass = (active) =>
    `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      active ? "bg-slate-100 dark:bg-white/10" : ""
    }`;

  return (
    <header className='sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-[#232c3f] dark:bg-[#0b0f1a]/80 md:px-8'>
      <button
        className='icon-btn md:hidden'
        onClick={() => dispatch(setOpenSidebar(true))}
        aria-label='Open menu'
      >
        <MdMenu size={24} />
      </button>

      <div className='hidden md:block'>
        <p className='text-sm font-semibold'>
          Hello, {user?.name?.split(" ")[0]} 👋
        </p>
        <p className='muted text-xs'>
          {user?.isAdmin ? "Administrator" : user?.title || "Employee"}
        </p>
      </div>

      <div className='flex items-center gap-1'>
        <button
          className='icon-btn'
          onClick={() => dispatch(toggleTheme())}
          aria-label='Toggle dark mode'
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        <NotificationPanel />

        <Menu as='div' className='relative ml-1'>
          <Menu.Button className='flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-white/10'>
            <Avatar name={user?.name} size='h-9 w-9 text-sm' />
            <MdKeyboardArrowDown className='muted' />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter='transition duration-100 ease-out'
            enterFrom='opacity-0 scale-95'
            enterTo='opacity-100 scale-100'
            leave='transition duration-75 ease-in'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Menu.Items className='card absolute right-0 z-40 mt-2 w-56 origin-top-right p-1.5 shadow-xl focus:outline-none'>
              <div className='border-b border-slate-100 px-3 py-2 dark:border-[#232c3f]'>
                <p className='truncate text-sm font-bold'>{user?.name}</p>
                <p className='muted truncate text-xs'>{user?.email}</p>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button className={itemClass(active)} onClick={() => setProfileOpen(true)}>
                    <MdPersonOutline size={18} /> My profile
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button className={itemClass(active)} onClick={() => setPasswordOpen(true)}>
                    <MdLockOutline size={18} /> Change password
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={itemClass(active) + " text-rose-600"}
                    onClick={handleLogout}
                  >
                    <FiLogOut size={18} /> Log out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  );
};

export default Navbar;
