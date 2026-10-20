import clsx from "clsx";
import { BiImages } from "react-icons/bi";
import { FaRegCommentDots } from "react-icons/fa";
import { MdOutlineCalendarToday, MdTaskAlt } from "react-icons/md";
import { Link } from "react-router-dom";
import { dueInfo } from "../../utils";
import { AvatarStack, PriorityBadge } from "../ui";

const TaskCard = ({ task }) => {
  const due = dueInfo(task);
  const comments = (task.activities || []).filter((a) => a.type === "commented").length;
  const subs = task.subTasks || [];
  const subsDone = subs.filter((s) => s.isCompleted).length;

  return (
    <Link
      to={`/task/${task._id}`}
      className='card block p-4 transition hover:-translate-y-0.5 hover:shadow-md'
    >
      <div className='mb-2 flex items-center justify-between gap-2'>
        <PriorityBadge priority={task.priority} />
        <span
          className={clsx(
            "flex items-center gap-1 text-xs font-semibold",
            due.overdue ? "text-rose-500" : due.soon ? "text-amber-500" : "muted"
          )}
        >
          <MdOutlineCalendarToday /> {due.text}
        </span>
      </div>

      <p className='line-clamp-2 text-sm font-bold'>{task.title}</p>
      {task.description && (
        <p className='muted mt-1 line-clamp-2 text-xs'>{task.description}</p>
      )}

      <div className='mt-3 flex items-center justify-between'>
        <AvatarStack users={task.team} />
        <div className='muted flex items-center gap-3 text-xs'>
          {subs.length > 0 && (
            <span className='flex items-center gap-1'>
              <MdTaskAlt /> {subsDone}/{subs.length}
            </span>
          )}
          {comments > 0 && (
            <span className='flex items-center gap-1'>
              <FaRegCommentDots /> {comments}
            </span>
          )}
          {task.assets?.length > 0 && (
            <span className='flex items-center gap-1'>
              <BiImages /> {task.assets.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;
