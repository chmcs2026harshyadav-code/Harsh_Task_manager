import clsx from "clsx";
import { useEffect, useState } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { MdEdit, MdOutlineAssignment, MdOutlineSearch, MdOutlineViewKanban, MdOutlineViewList } from "react-icons/md";
import { useSelector } from "react-redux";
import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import TaskCard from "../components/tasks/TaskCard";
import TaskForm from "../components/tasks/TaskForm";
import {
  AvatarStack,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  PriorityBadge,
  StageBadge,
} from "../components/ui";
import { useGetAllTaskQuery, useTrashTaskMutation } from "../redux/slices/api/taskApiSlice";
import { useGetTeamListsQuery } from "../redux/slices/api/userApiSlice";
import { PRIORITIES, PRIORITY_LABEL, STAGES, STAGE_DOT, STAGE_LABEL, canEditTask, dueInfo } from "../utils";

const SLUG_TO_STAGE = {
  todo: "todo",
  "in-progress": "in progress",
  submitted: "submitted",
  completed: "completed",
};

const TABS = [
  { label: "All", to: "/tasks" },
  { label: "To Do", to: "/tasks/todo" },
  { label: "In Progress", to: "/tasks/in-progress" },
  { label: "Under Review", to: "/tasks/submitted" },
  { label: "Completed", to: "/tasks/completed" },
];

const Tasks = () => {
  const { stage: slug } = useParams();
  const stage = SLUG_TO_STAGE[slug] || "";
  const { user } = useSelector((s) => s.auth);
  const isAdmin = !!user?.isAdmin;

  const [params, setParams] = useSearchParams();
  const priority = params.get("priority") || "";
  const due = params.get("due") || "";
  const sort = params.get("sort") || "";
  const assignee = params.get("assignee") || "";
  const urlSearch = params.get("search") || "";

  // search box: wait until the user stops typing, then update the url
  const [text, setText] = useState(urlSearch);
  // keep the box in sync when the url changes from outside (sidebar link, back button)
  useEffect(() => {
    setText(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    const id = setTimeout(() => setParam("search", text), 300);
    return () => clearTimeout(id);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem("taskView") || "list";
    } catch {
      return "list";
    }
  });
  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem("taskView", v);
    } catch {
      /* ignore */
    }
  };

  const { data, isLoading, isFetching } = useGetAllTaskQuery({
    stage,
    priority,
    due,
    sort,
    assignee,
    search: urlSearch,
  });
  const { data: users = [] } = useGetTeamListsQuery({ search: "" }, { skip: !isAdmin });
  const [trashTask, { isLoading: trashing }] = useTrashTaskMutation();

  const [formTask, setFormTask] = useState(undefined); // undefined=closed, null=new, task=edit
  const [toTrash, setToTrash] = useState(null);

  const tasks = data?.tasks || [];
  const showBoard = view === "board" && !stage;
  const filtersOn = priority || due || assignee || urlSearch;

  const clearFilters = () => {
    setText("");
    setParams({}, { replace: true });
  };

  const confirmTrash = async () => {
    try {
      const res = await trashTask(toTrash._id).unwrap();
      toast.success(res.message);
      setToTrash(null);
    } catch (err) {
      toast.error(err?.data?.message || "Could not move to trash");
    }
  };

  const title = stage ? STAGE_LABEL[stage] + " tasks" : "All tasks";

  return (
    <>
      <PageHeader title={title} subtitle={isFetching && !isLoading ? "Updating…" : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}>
        {!stage && (
          <div className='flex rounded-lg border border-slate-300 p-0.5 dark:border-[#2d3750]'>
            {[
              ["list", <MdOutlineViewList key='l' size={20} />],
              ["board", <MdOutlineViewKanban key='b' size={20} />],
            ].map(([v, icon]) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                title={v === "list" ? "List view" : "Board view"}
                className={clsx(
                  "rounded-md p-1.5 transition",
                  view === v ? "bg-indigo-600 text-white" : "muted hover:bg-slate-100 dark:hover:bg-white/10"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
        <button className='btn btn-primary' onClick={() => setFormTask(null)}>
          <FaPlus size={12} /> New task
        </button>
      </PageHeader>

      {/* status tabs */}
      <div className='mb-4 flex gap-1 overflow-x-auto'>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={{ pathname: tab.to, search: params.toString() }}
            end
            className={({ isActive }) =>
              clsx(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "muted hover:bg-white dark:hover:bg-white/10"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* filters */}
      <div className='card mb-4 flex flex-wrap items-center gap-3 p-3'>
        <div className='relative min-w-[200px] flex-1'>
          <MdOutlineSearch className='muted absolute left-3 top-1/2 -translate-y-1/2 text-lg' />
          <input
            className='input pl-9'
            placeholder='Search by title, description…'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <select className='input w-auto' value={priority} onChange={(e) => setParam("priority", e.target.value)}>
          <option value=''>All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </select>

        <select className='input w-auto' value={due} onChange={(e) => setParam("due", e.target.value)}>
          <option value=''>Any due date</option>
          <option value='overdue'>Overdue</option>
          <option value='today'>Due today</option>
          <option value='week'>Due this week</option>
        </select>

        {isAdmin && (
          <select className='input w-auto' value={assignee} onChange={(e) => setParam("assignee", e.target.value)}>
            <option value=''>All employees</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        )}

        <select className='input w-auto' value={sort} onChange={(e) => setParam("sort", e.target.value)}>
          <option value=''>Newest first</option>
          <option value='oldest'>Oldest first</option>
          <option value='due'>Due date (earliest)</option>
        </select>

        {filtersOn && (
          <button className='btn btn-secondary btn-sm' onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : tasks.length === 0 ? (
        <div className='card'>
          <EmptyState
            icon={<MdOutlineAssignment />}
            title={filtersOn ? "No task matches your filters" : "No tasks here yet"}
            text={filtersOn ? "Try changing or clearing the filters." : "Create a task to get started."}
          >
            {!filtersOn && (
              <button className='btn btn-primary' onClick={() => setFormTask(null)}>
                <FaPlus size={12} /> New task
              </button>
            )}
          </EmptyState>
        </div>
      ) : showBoard ? (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {STAGES.map((s) => {
            const col = tasks.filter((t) => t.stage === s);
            return (
              <div key={s} className='rounded-2xl bg-slate-200/50 p-3 dark:bg-white/[0.03]'>
                <div className='mb-3 flex items-center gap-2 px-1'>
                  <span className={clsx("h-2.5 w-2.5 rounded-full", STAGE_DOT[s])} />
                  <p className='text-sm font-bold'>{STAGE_LABEL[s]}</p>
                  <span className='muted text-xs font-semibold'>{col.length}</span>
                </div>
                <div className='space-y-3'>
                  {col.map((t) => (
                    <TaskCard key={t._id} task={t} />
                  ))}
                  {col.length === 0 && <p className='muted py-6 text-center text-xs'>No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='card overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[720px]'>
              <thead>
                <tr>
                  <th className='th'>Task</th>
                  <th className='th'>Priority</th>
                  <th className='th'>Status</th>
                  <th className='th'>Due</th>
                  <th className='th'>Assigned to</th>
                  <th className='th text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const d = dueInfo(t);
                  return (
                    <tr key={t._id} className='row'>
                      <td className='td max-w-[260px]'>
                        <Link to={`/task/${t._id}`} className='block truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-300'>
                          {t.title}
                        </Link>
                      </td>
                      <td className='td'><PriorityBadge priority={t.priority} /></td>
                      <td className='td'><StageBadge stage={t.stage} /></td>
                      <td className={clsx("td whitespace-nowrap", d.overdue ? "font-semibold text-rose-500" : d.soon ? "font-semibold text-amber-500" : "muted")}>
                        {d.text}
                      </td>
                      <td className='td'><AvatarStack users={t.team} /></td>
                      <td className='td'>
                        <div className='flex justify-end gap-1'>
                          {canEditTask(t, user) && (
                            <button className='icon-btn' title='Edit' onClick={() => setFormTask(t)}>
                              <MdEdit size={18} />
                            </button>
                          )}
                          <button className='icon-btn hover:!text-rose-600' title='Move to trash' onClick={() => setToTrash(t)}>
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

      {formTask !== undefined && (
        <TaskForm task={formTask || undefined} onClose={() => setFormTask(undefined)} />
      )}

      <ConfirmDialog
        open={!!toTrash}
        onClose={() => setToTrash(null)}
        onConfirm={confirmTrash}
        loading={trashing}
        danger
        title='Move to trash?'
        message={`"${toTrash?.title}" will be moved to trash. You can restore it from the Trash page.`}
        confirmLabel='Move to trash'
      />
    </>
  );
};

export default Tasks;
