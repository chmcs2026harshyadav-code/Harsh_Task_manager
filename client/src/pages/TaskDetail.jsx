import clsx from "clsx";
import moment from "moment";
import { useState } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaPaperPlane,
  FaPlay,
  FaRegCopy,
  FaTrashAlt,
  FaTrashRestore,
} from "react-icons/fa";
import { MdEdit, MdOutlineCalendarToday, MdUndo } from "react-icons/md";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ReviewModal, SubmitModal } from "../components/tasks/WorkflowModals";
import TaskForm from "../components/tasks/TaskForm";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ImageGrid,
  PageLoader,
  PriorityBadge,
  Spinner,
  StageBadge,
} from "../components/ui";
import {
  useChangeSubTaskStatusMutation,
  useChangeTaskStageMutation,
  useCreateSubTaskMutation,
  useDeleteRestoreTaskMutation,
  useDuplicateTaskMutation,
  useGetSingleTaskQuery,
  usePostTaskActivityMutation,
  useTrashTaskMutation,
} from "../redux/slices/api/taskApiSlice";
import { canEditTask, dueInfo, formatDate, isMemberOf } from "../utils";

const ACTIVITY_STYLE = {
  assigned: "bg-slate-500",
  started: "bg-sky-500",
  "in progress": "bg-amber-500",
  submitted: "bg-violet-500",
  completed: "bg-emerald-500",
  rejected: "bg-rose-500",
  commented: "bg-indigo-500",
  trashed: "bg-slate-600",
  restored: "bg-teal-500",
  bug: "bg-rose-600",
};

const Card = ({ title, right, children, className }) => (
  <section className={clsx("card", className)}>
    {title && (
      <div className='flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-[#232c3f]'>
        <h2 className='font-bold'>{title}</h2>
        {right}
      </div>
    )}
    <div className='p-5'>{children}</div>
  </section>
);

const Banner = ({ tone = "slate", title, children, action }) => {
  const tones = {
    slate: "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-white/5 dark:text-slate-200",
    amber: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    violet: "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200",
    green: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    rose: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  };
  return (
    <div className={clsx("flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      <div>
        <p className='font-bold'>{title}</p>
        {children && <p className='mt-0.5'>{children}</p>}
      </div>
      {action}
    </div>
  );
};

const SubTasks = ({ task, canChange }) => {
  const [toggle] = useChangeSubTaskStatusMutation();
  const [addSub, { isLoading }] = useCreateSubTaskMutation();
  const [text, setText] = useState("");

  const subs = task.subTasks || [];
  const done = subs.filter((s) => s.isCompleted).length;
  const pct = subs.length ? Math.round((done / subs.length) * 100) : 0;

  const handleToggle = async (s) => {
    try {
      await toggle({ id: task._id, subId: s._id, status: !s.isCompleted }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "Could not update sub-task");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await addSub({ id: task._id, data: { title: text.trim() } }).unwrap();
      setText("");
    } catch (err) {
      toast.error(err?.data?.message || "Could not add sub-task");
    }
  };

  return (
    <Card title='Sub-tasks' right={subs.length > 0 && <span className='muted text-xs font-semibold'>{done}/{subs.length} done</span>}>
      {subs.length > 0 && (
        <div className='mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10'>
          <div className='h-full rounded-full bg-emerald-500 transition-all' style={{ width: `${pct}%` }} />
        </div>
      )}

      <ul className='space-y-1'>
        {subs.map((s) => (
          <li key={s._id}>
            <label className={clsx("flex items-center gap-3 rounded-lg px-2 py-2", canChange && "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5")}>
              <input
                type='checkbox'
                className='h-4 w-4 accent-emerald-600'
                checked={!!s.isCompleted}
                disabled={!canChange}
                onChange={() => handleToggle(s)}
              />
              <span className={clsx("text-sm", s.isCompleted && "muted line-through")}>{s.title}</span>
            </label>
          </li>
        ))}
        {subs.length === 0 && <p className='muted text-sm'>No sub-tasks yet.</p>}
      </ul>

      {canChange && (
        <form onSubmit={handleAdd} className='mt-4 flex gap-2'>
          <input className='input' placeholder='Add a sub-task…' value={text} onChange={(e) => setText(e.target.value)} />
          <button className='btn btn-secondary' disabled={isLoading || !text.trim()}>
            {isLoading ? <Spinner /> : "Add"}
          </button>
        </form>
      )}
    </Card>
  );
};

const Discussion = ({ task, canPost }) => {
  const [tab, setTab] = useState("comments");
  const [text, setText] = useState("");
  const [post, { isLoading }] = usePostTaskActivityMutation();

  const all = [...(task.activities || [])].reverse();
  const list = tab === "comments" ? all.filter((a) => a.type === "commented") : all;

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await post({ id: task._id, activity: text.trim() }).unwrap();
      setText("");
    } catch (err) {
      toast.error(err?.data?.message || "Could not post comment");
    }
  };

  return (
    <Card
      title='Discussion'
      right={
        <div className='flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold dark:bg-white/10'>
          {[
            ["comments", "Comments"],
            ["timeline", "Timeline"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={clsx("rounded-md px-3 py-1 transition", tab === k ? "bg-white shadow dark:bg-[#232c3f]" : "muted")}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      {canPost && (
        <form onSubmit={send} className='mb-5 flex gap-2'>
          <textarea
            rows={2}
            className='input resize-none'
            placeholder='Write a comment…'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className='btn btn-primary self-end' disabled={isLoading || !text.trim()} title='Post comment'>
            {isLoading ? <Spinner /> : <FaPaperPlane />}
          </button>
        </form>
      )}

      {list.length === 0 ? (
        <p className='muted py-4 text-center text-sm'>
          {tab === "comments" ? "No comments yet." : "No activity yet."}
        </p>
      ) : (
        <ul className='space-y-4'>
          {list.map((a) => (
            <li key={a._id} className='flex gap-3'>
              <Avatar name={a.by?.name} size='h-9 w-9 text-sm' />
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                  <span className='text-sm font-bold'>{a.by?.name || "Deleted user"}</span>
                  {tab === "timeline" && (
                    <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white", ACTIVITY_STYLE[a.type] || "bg-slate-500")}>
                      {a.type}
                    </span>
                  )}
                  <span className='muted text-xs' title={moment(a.date).format("DD MMM YYYY, hh:mm A")}>
                    {moment(a.date).fromNow()}
                  </span>
                </div>
                <p className='mt-0.5 whitespace-pre-wrap break-words text-sm'>{a.activity}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = !!user?.isAdmin;

  const { data, isLoading, error } = useGetSingleTaskQuery(id);
  const [changeStage, { isLoading: changing }] = useChangeTaskStageMutation();
  const [duplicate, { isLoading: duplicating }] = useDuplicateTaskMutation();
  const [trashTask, { isLoading: trashing }] = useTrashTaskMutation();
  const [deleteRestore, { isLoading: restoring }] = useDeleteRestoreTaskMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [review, setReview] = useState(null); // "approve" | "reject"
  const [confirm, setConfirm] = useState(null); // "trash" | "delete"

  if (isLoading) return <PageLoader />;

  const task = data?.task;

  if (error || !task) {
    return (
      <div className='card'>
        <EmptyState title='Task not found' text={error?.data?.message || "This task does not exist or you do not have access to it."}>
          <Link to='/tasks' className='btn btn-primary'>Back to tasks</Link>
        </EmptyState>
      </div>
    );
  }

  const member = isMemberOf(task, user);
  const trashed = task.isTrashed;
  const due = dueInfo(task);

  const canStart = member && !trashed && task.stage === "todo";
  const canSubmit = member && !trashed && ["todo", "in progress"].includes(task.stage);
  const canReview = isAdmin && !trashed && task.stage === "submitted";
  const canEdit = !trashed && canEditTask(task, user);
  const canDiscuss = isAdmin || member;

  const run = async (fn, okMsg) => {
    try {
      const res = await fn().unwrap();
      toast.success(okMsg || res?.message);
      return true;
    } catch (err) {
      toast.error(err?.data?.message || "Action failed");
      return false;
    }
  };

  const startWork = () => run(() => changeStage({ id: task._id, stage: "in progress" }), "Task started");
  const doDuplicate = () => run(() => duplicate(task._id));
  const restore = () => run(() => deleteRestore({ id: task._id, actionType: "restore" }));

  const confirmAction = async () => {
    if (confirm === "trash") {
      if (await run(() => trashTask(task._id))) setConfirm(null);
    } else if (confirm === "delete") {
      if (await run(() => deleteRestore({ id: task._id, actionType: "delete" }))) {
        setConfirm(null);
        navigate("/trashed");
      }
    }
  };

  return (
    <div className='space-y-5'>
      <button onClick={() => navigate(-1)} className='muted inline-flex items-center gap-2 text-sm font-semibold hover:text-indigo-600'>
        <FaArrowLeft size={12} /> Back
      </button>

      {/* header */}
      <div className='card p-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <StageBadge stage={task.stage} />
              <PriorityBadge priority={task.priority} />
              {due.overdue && <span className='badge bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'>Overdue</span>}
              {trashed && <span className='badge bg-slate-200 text-slate-700 dark:bg-slate-600/40 dark:text-slate-200'>In trash</span>}
            </div>
            <h1 className='break-words text-2xl font-extrabold tracking-tight'>{task.title}</h1>
            <p className='muted mt-1 text-sm'>
              Created by {task.createdBy?.name || "—"} · {moment(task.createdAt).format("DD MMM YYYY")}
            </p>
          </div>

          {/* actions */}
          <div className='flex flex-wrap gap-2'>
            {canStart && (
              <button className='btn btn-secondary' onClick={startWork} disabled={changing}>
                {changing ? <Spinner /> : <FaPlay size={11} />} Start work
              </button>
            )}
            {canSubmit && (
              <button className='btn btn-primary' onClick={() => setSubmitOpen(true)}>
                <FaPaperPlane size={12} /> Submit for review
              </button>
            )}
            {canReview && (
              <>
                <button className='btn btn-success' onClick={() => setReview("approve")}>
                  <FaCheck size={12} /> Approve & complete
                </button>
                <button className='btn btn-secondary' onClick={() => setReview("reject")}>
                  <MdUndo size={16} /> Send back
                </button>
              </>
            )}
            {canEdit && (
              <button className='btn btn-secondary' onClick={() => setEditOpen(true)}>
                <MdEdit size={16} /> Edit
              </button>
            )}
            {isAdmin && !trashed && (
              <button className='btn btn-secondary' onClick={doDuplicate} disabled={duplicating}>
                {duplicating ? <Spinner /> : <FaRegCopy size={13} />} Duplicate
              </button>
            )}
            {!trashed && (
              <button className='btn btn-secondary hover:!text-rose-600' onClick={() => setConfirm("trash")}>
                <FaTrashAlt size={13} /> Trash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* status banners */}
      {trashed && (
        <Banner
          tone='slate'
          title='This task is in trash'
          action={
            <div className='flex gap-2'>
              <button className='btn btn-secondary btn-sm' onClick={restore} disabled={restoring}>
                <FaTrashRestore size={11} /> Restore
              </button>
              {isAdmin && (
                <button className='btn btn-danger btn-sm' onClick={() => setConfirm("delete")}>
                  Delete forever
                </button>
              )}
            </div>
          }
        >
          {isAdmin ? "Restore it or delete it permanently." : "You can restore it. Only admin can delete it permanently."}
        </Banner>
      )}
      {!trashed && task.stage === "submitted" && !isAdmin && (
        <Banner tone='violet' title='Waiting for admin review'>
          You submitted this work. The admin will mark it as completed or send it back with feedback.
        </Banner>
      )}
      {!trashed && task.stage === "in progress" && task.reviewNote && (
        <Banner tone='amber' title='Admin sent this task back'>
          {task.reviewNote}
        </Banner>
      )}
      {!trashed && task.stage === "completed" && (
        <Banner tone='green' title={`Completed${task.completedAt ? " on " + formatDate(task.completedAt) : ""}`}>
          {task.reviewNote || undefined}
        </Banner>
      )}

      <div className='grid gap-5 lg:grid-cols-3'>
        <div className='space-y-5 lg:col-span-2'>
          <Card title='Description'>
            {task.description ? (
              <p className='whitespace-pre-wrap break-words text-sm leading-relaxed'>{task.description}</p>
            ) : (
              <p className='muted text-sm'>No description.</p>
            )}

            {task.links?.length > 0 && (
              <div className='mt-4'>
                <p className='label'>Links</p>
                <ul className='space-y-1'>
                  {task.links.map((l, i) => (
                    <li key={i}>
                      <a href={l} target='_blank' rel='noreferrer' className='break-all text-sm text-indigo-600 hover:underline dark:text-indigo-300'>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {task.assets?.length > 0 && (
              <div className='mt-4'>
                <p className='label'>Attachments</p>
                <ImageGrid images={task.assets} />
              </div>
            )}
          </Card>

          {task.submission?.submittedAt && (
            <Card title='Submitted work'>
              <div className='mb-3 flex items-center gap-3'>
                <Avatar name={task.submission.by?.name} size='h-9 w-9 text-sm' />
                <div>
                  <p className='text-sm font-bold'>{task.submission.by?.name || "Employee"}</p>
                  <p className='muted text-xs'>{moment(task.submission.submittedAt).format("DD MMM YYYY, hh:mm A")}</p>
                </div>
              </div>
              <p className='whitespace-pre-wrap break-words text-sm leading-relaxed'>{task.submission.note}</p>
              {task.submission.images?.length > 0 && (
                <div className='mt-4'>
                  <p className='label'>Proof photos</p>
                  <ImageGrid images={task.submission.images} />
                </div>
              )}
            </Card>
          )}

          <SubTasks task={task} canChange={!trashed && (isAdmin || member)} />
          <Discussion task={task} canPost={canDiscuss} />
        </div>

        {/* side details */}
        <div className='space-y-5'>
          <Card title='Details'>
            <dl className='space-y-4 text-sm'>
              <div className='flex items-center justify-between'>
                <dt className='muted'>Status</dt>
                <dd><StageBadge stage={task.stage} /></dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='muted'>Priority</dt>
                <dd><PriorityBadge priority={task.priority} /></dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='muted'>Due date</dt>
                <dd className={clsx("flex items-center gap-1 font-semibold", due.overdue && "text-rose-500")}>
                  <MdOutlineCalendarToday /> {due.text}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title={`Assigned to (${task.team?.length || 0})`}>
            <ul className='space-y-3'>
              {(task.team || []).map((m) => (
                <li key={m._id} className='flex items-center gap-3'>
                  <Avatar name={m.name} size='h-9 w-9 text-sm' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold'>{m.name}</p>
                    <p className='muted truncate text-xs'>{m.title}</p>
                  </div>
                </li>
              ))}
              {!task.team?.length && <p className='muted text-sm'>Nobody assigned.</p>}
            </ul>
          </Card>
        </div>
      </div>

      {editOpen && <TaskForm task={task} onClose={() => setEditOpen(false)} />}
      {submitOpen && <SubmitModal task={task} onClose={() => setSubmitOpen(false)} />}
      {review && <ReviewModal task={task} mode={review} onClose={() => setReview(null)} />}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirmAction}
        loading={trashing || restoring}
        danger
        title={confirm === "delete" ? "Delete permanently?" : "Move to trash?"}
        message={
          confirm === "delete"
            ? "This task and its images will be deleted forever. This can not be undone."
            : "The task will be moved to trash. You can restore it later."
        }
        confirmLabel={confirm === "delete" ? "Delete forever" : "Move to trash"}
      />
    </div>
  );
};

export default TaskDetail;
