import clsx from "clsx";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  MdOutlineAssignment,
  MdOutlineErrorOutline,
  MdOutlinePendingActions,
  MdOutlineRateReview,
  MdOutlineTimelapse,
  MdTaskAlt,
} from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import TaskForm from "../components/tasks/TaskForm";
import {
  Avatar,
  AvatarStack,
  EmptyState,
  PageHeader,
  PageLoader,
  PriorityBadge,
  StageBadge,
} from "../components/ui";
import { useGetDasboardStatsQuery } from "../redux/slices/api/taskApiSlice";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STAGE_COLOR,
  STAGE_LABEL,
  STAGES,
  dueInfo,
  formatDate,
} from "../utils";

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to} className='card flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md'>
    <div>
      <p className='muted text-xs font-semibold uppercase tracking-wide'>{label}</p>
      <p className='mt-1 text-3xl font-extrabold'>{value}</p>
    </div>
    <div className={clsx("flex h-11 w-11 items-center justify-center rounded-xl text-xl text-white", color)}>
      {icon}
    </div>
  </Link>
);

const Dashboard = () => {
  const { user, theme } = useSelector((s) => s.auth);
  const { data, isLoading } = useGetDasboardStatsQuery();
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) return <PageLoader />;

  const isAdmin = !!user?.isAdmin;
  const t = data?.tasks || {};
  const dark = theme === "dark";
  const axis = dark ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    background: dark ? "#141a29" : "#fff",
    border: `1px solid ${dark ? "#232c3f" : "#e2e8f0"}`,
    borderRadius: 10,
    color: dark ? "#e2e8f0" : "#0f172a",
  };

  const stageData = STAGES.map((s) => ({
    name: STAGE_LABEL[s],
    key: s,
    value: t[s] || 0,
  }));
  const hasStageData = stageData.some((d) => d.value > 0);

  const priorityData = (data?.graphData || []).map((d) => ({
    ...d,
    label: PRIORITY_LABEL[d.name] || d.name,
  }));

  const attention = isAdmin ? data?.pendingReview || [] : data?.upcoming || [];

  return (
    <>
      <PageHeader
        title='Dashboard'
        subtitle={
          isAdmin
            ? "Overview of all tasks and your team."
            : "Overview of the tasks assigned to you."
        }
      >
        <button className='btn btn-primary' onClick={() => setFormOpen(true)}>
          <FaPlus size={12} /> New task
        </button>
      </PageHeader>

      <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        <StatCard label='Total' value={data?.totalTasks || 0} to='/tasks' color='bg-indigo-600' icon={<MdOutlineAssignment />} />
        <StatCard label='To do' value={t.todo || 0} to='/tasks/todo' color='bg-slate-500' icon={<MdOutlinePendingActions />} />
        <StatCard label='In progress' value={t["in progress"] || 0} to='/tasks/in-progress' color='bg-amber-500' icon={<MdOutlineTimelapse />} />
        <StatCard label={isAdmin ? "To review" : "Under review"} value={t.submitted || 0} to='/tasks/submitted' color='bg-violet-600' icon={<MdOutlineRateReview />} />
        <StatCard label='Completed' value={t.completed || 0} to='/tasks/completed' color='bg-emerald-600' icon={<MdTaskAlt />} />
        <StatCard label='Overdue' value={data?.overdue || 0} to='/tasks?due=overdue' color='bg-rose-600' icon={<MdOutlineErrorOutline />} />
      </div>

      <div className='mt-5 grid gap-5 lg:grid-cols-3'>
        {/* needs attention */}
        <div className='card lg:col-span-2'>
          <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#232c3f]'>
            <h2 className='font-bold'>{isAdmin ? "Waiting for your review" : "Upcoming deadlines"}</h2>
            <Link to={isAdmin ? "/tasks/submitted" : "/tasks?sort=due"} className='text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300'>
              View all
            </Link>
          </div>
          {attention.length === 0 ? (
            <EmptyState
              icon={isAdmin ? <MdOutlineRateReview /> : <MdTaskAlt />}
              title={isAdmin ? "Nothing to review" : "No pending tasks"}
              text={isAdmin ? "When employees submit their work it shows up here." : "You are all caught up."}
            />
          ) : (
            <ul>
              {attention.map((task) => {
                const due = dueInfo(task);
                return (
                  <li key={task._id} className='row'>
                    <Link to={`/task/${task._id}`} className='flex items-center gap-3 px-5 py-3'>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold'>{task.title}</p>
                        <p className={clsx("mt-0.5 text-xs", due.overdue ? "font-semibold text-rose-500" : "muted")}>
                          Due {due.text}
                        </p>
                      </div>
                      <AvatarStack users={task.team} max={2} />
                      <StageBadge stage={task.stage} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* stage chart */}
        <div className='card p-5'>
          <h2 className='mb-2 font-bold'>Tasks by status</h2>
          {hasStageData ? (
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie data={stageData} dataKey='value' nameKey='name' innerRadius={55} outerRadius={85} paddingAngle={3} stroke='none'>
                    {stageData.map((d) => (
                      <Cell key={d.key} fill={STAGE_COLOR[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: axis, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title='No data yet' text='Create a task to see the chart.' />
          )}
        </div>

        {/* priority chart */}
        <div className='card p-5'>
          <h2 className='mb-2 font-bold'>Tasks by priority</h2>
          {priorityData.length ? (
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray='3 3' stroke={dark ? "#232c3f" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey='label' tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? "#ffffff10" : "#00000008" }} />
                  <Bar dataKey='total' name='Tasks' radius={[6, 6, 0, 0]}>
                    {priorityData.map((d) => (
                      <Cell key={d.name} fill={PRIORITY_COLOR[d.name] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title='No data yet' />
          )}
        </div>

        {/* recent tasks */}
        <div className='card overflow-hidden lg:col-span-2'>
          <div className='border-b border-slate-100 px-5 py-4 dark:border-[#232c3f]'>
            <h2 className='font-bold'>Recent tasks</h2>
          </div>
          {data?.last10Task?.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[560px]'>
                <thead>
                  <tr>
                    <th className='th'>Task</th>
                    <th className='th'>Priority</th>
                    <th className='th'>Status</th>
                    <th className='th'>Team</th>
                    <th className='th'>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.last10Task.map((task) => (
                    <tr key={task._id} className='row'>
                      <td className='td max-w-[220px]'>
                        <Link to={`/task/${task._id}`} className='block truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-300'>
                          {task.title}
                        </Link>
                      </td>
                      <td className='td'><PriorityBadge priority={task.priority} /></td>
                      <td className='td'><StageBadge stage={task.stage} /></td>
                      <td className='td'><AvatarStack users={task.team} max={3} /></td>
                      <td className='td muted whitespace-nowrap'>{formatDate(task.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<MdOutlineAssignment />} title='No tasks yet' text='Create your first task to get started.' />
          )}
        </div>

        {/* team (admin) */}
        {isAdmin && (
          <div className='card'>
            <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#232c3f]'>
              <h2 className='font-bold'>Team ({data?.totalUsers || 0})</h2>
              <Link to='/team' className='text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300'>
                Manage
              </Link>
            </div>
            <ul>
              {(data?.users || []).map((u) => (
                <li key={u._id} className='row flex items-center gap-3 px-5 py-3'>
                  <Avatar name={u.name} size='h-9 w-9 text-sm' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold'>{u.name}</p>
                    <p className='muted truncate text-xs'>{u.title}{u.isAdmin ? " · Admin" : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {formOpen && <TaskForm onClose={() => setFormOpen(false)} />}
    </>
  );
};

export default Dashboard;
