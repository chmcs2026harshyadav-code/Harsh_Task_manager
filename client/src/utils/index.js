import moment from "moment";

export const STAGES = ["todo", "in progress", "submitted", "completed"];
export const PRIORITIES = ["high", "medium", "normal", "low"];

export const STAGE_LABEL = {
  todo: "To Do",
  "in progress": "In Progress",
  submitted: "Under Review",
  completed: "Completed",
};

export const PRIORITY_LABEL = {
  high: "High",
  medium: "Medium",
  normal: "Normal",
  low: "Low",
};

export const STAGE_STYLE = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-200",
  "in progress": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  submitted: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export const PRIORITY_STYLE = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  normal: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300",
};

export const STAGE_DOT = {
  todo: "bg-slate-400",
  "in progress": "bg-amber-500",
  submitted: "bg-violet-500",
  completed: "bg-emerald-500",
};

export const STAGE_COLOR = {
  todo: "#94a3b8",
  "in progress": "#f59e0b",
  submitted: "#8b5cf6",
  completed: "#10b981",
};

export const PRIORITY_COLOR = {
  high: "#f43f5e",
  medium: "#fb923c",
  normal: "#38bdf8",
  low: "#94a3b8",
};

export const getInitials = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("") || "?";
};

// yyyy-mm-dd for <input type="date">
export const dateFormatter = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d)) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const formatDate = (date) => (date ? moment(date).format("DD MMM YYYY") : "-");

// due date helper -> { text, overdue, soon }
export const dueInfo = (task) => {
  if (!task?.date) return { text: "-", overdue: false, soon: false };
  const due = moment(task.date).startOf("day");
  const today = moment().startOf("day");
  const diff = due.diff(today, "days");
  const done = task.stage === "completed";

  let text = formatDate(task.date);
  if (!done) {
    if (diff < 0) text += ` (${-diff}d overdue)`;
    else if (diff === 0) text += " (today)";
    else if (diff === 1) text += " (tomorrow)";
  }
  return { text, overdue: !done && diff < 0, soon: !done && diff >= 0 && diff <= 1 };
};

// can the current user edit this task from the UI? (server checks again)
export const isMemberOf = (task, user) =>
  !!user && (task?.team || []).some((t) => (t?._id || t) === user._id);

export const canEditTask = (task, user) => {
  if (!user || !task) return false;
  if (user.isAdmin) return true;
  return (
    isMemberOf(task, user) &&
    !task.isTrashed &&
    ["todo", "in progress"].includes(task.stage)
  );
};
