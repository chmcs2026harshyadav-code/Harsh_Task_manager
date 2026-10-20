import { Popover, Transition } from "@headlessui/react";
import moment from "moment";
import { Fragment } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkNotiAsReadMutation,
} from "../redux/slices/api/userApiSlice";

const NotificationPanel = () => {
  const navigate = useNavigate();
  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000, // check for new notifications every 30 sec
  });
  const [markRead] = useMarkNotiAsReadMutation();

  const list = data || [];

  const open = async (n, close) => {
    close();
    try {
      await markRead({ type: "one", id: n._id }).unwrap();
    } catch {
      /* ignore */
    }
    if (n.task?._id) navigate(`/task/${n.task._id}`);
  };

  return (
    <Popover className='relative'>
      <Popover.Button className='icon-btn relative' aria-label='Notifications'>
        <IoNotificationsOutline size={22} />
        {list.length > 0 && (
          <span className='absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white'>
            {list.length > 9 ? "9+" : list.length}
          </span>
        )}
      </Popover.Button>

      <Transition
        as={Fragment}
        enter='transition duration-150 ease-out'
        enterFrom='opacity-0 translate-y-1'
        enterTo='opacity-100 translate-y-0'
        leave='transition duration-100 ease-in'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <Popover.Panel className='card absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden shadow-xl'>
          {({ close }) => (
            <>
              <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#232c3f]'>
                <p className='text-sm font-bold'>Notifications</p>
                {list.length > 0 && (
                  <button
                    className='text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300'
                    onClick={() => markRead({ type: "all" })}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className='max-h-96 overflow-y-auto'>
                {list.length === 0 ? (
                  <p className='muted px-4 py-8 text-center text-sm'>You are all caught up 🎉</p>
                ) : (
                  list.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => open(n, close)}
                      className='block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-[#1d2538] dark:hover:bg-white/5'
                    >
                      <p className='text-sm'>{n.text}</p>
                      <p className='muted mt-1 text-xs'>{moment(n.createdAt).fromNow()}</p>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default NotificationPanel;
