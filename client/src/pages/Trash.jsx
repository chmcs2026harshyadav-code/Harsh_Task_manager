import { useState } from "react";
import { FaTrashAlt, FaTrashRestore } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AvatarStack,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageLoader,
  PriorityBadge,
  StageBadge,
} from "../components/ui";
import {
  useDeleteRestoreTaskMutation,
  useGetAllTaskQuery,
} from "../redux/slices/api/taskApiSlice";
import { formatDate } from "../utils";

const Trash = () => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = !!user?.isAdmin;

  const { data, isLoading } = useGetAllTaskQuery({ isTrashed: "true" });
  const [run, { isLoading: working }] = useDeleteRestoreTaskMutation();

  // { id, actionType, title, message }
  const [confirm, setConfirm] = useState(null);

  const tasks = data?.tasks || [];

  const doAction = async ({ id, actionType }) => {
    try {
      const res = await run({ id, actionType }).unwrap();
      toast.success(res.message);
      setConfirm(null);
    } catch (err) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  return (
    <>
      <PageHeader
        title='Trash'
        subtitle={
          isAdmin
            ? "Only you (admin) can delete tasks permanently."
            : "Restore your tasks from here. Only admin can delete them permanently."
        }
      >
        {tasks.length > 0 && (
          <>
            <button
              className='btn btn-secondary'
              onClick={() =>
                setConfirm({
                  actionType: "restoreAll",
                  title: "Restore all tasks?",
                  message: "All tasks in trash will be restored.",
                  label: "Restore all",
                })
              }
            >
              <FaTrashRestore size={13} /> Restore all
            </button>
            {isAdmin && (
              <button
                className='btn btn-danger'
                onClick={() =>
                  setConfirm({
                    actionType: "deleteAll",
                    title: "Delete everything in trash?",
                    message: "All trashed tasks and their images will be deleted permanently. This can not be undone.",
                    label: "Delete all",
                    danger: true,
                  })
                }
              >
                <FaTrashAlt size={13} /> Delete all
              </button>
            )}
          </>
        )}
      </PageHeader>

      {isLoading ? (
        <PageLoader />
      ) : tasks.length === 0 ? (
        <div className='card'>
          <EmptyState icon={<FaTrashAlt />} title='Trash is empty' text='Tasks you move to trash will appear here.' />
        </div>
      ) : (
        <div className='card overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[680px]'>
              <thead>
                <tr>
                  <th className='th'>Task</th>
                  <th className='th'>Priority</th>
                  <th className='th'>Status</th>
                  <th className='th'>Team</th>
                  <th className='th'>Trashed on</th>
                  <th className='th text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} className='row'>
                    <td className='td max-w-[240px]'>
                      <Link to={`/task/${t._id}`} className='block truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-300'>
                        {t.title}
                      </Link>
                    </td>
                    <td className='td'><PriorityBadge priority={t.priority} /></td>
                    <td className='td'><StageBadge stage={t.stage} /></td>
                    <td className='td'><AvatarStack users={t.team} /></td>
                    <td className='td muted whitespace-nowrap'>{formatDate(t.trashedAt || t.updatedAt)}</td>
                    <td className='td'>
                      <div className='flex justify-end gap-2'>
                        <button
                          className='btn btn-secondary btn-sm'
                          onClick={() => doAction({ id: t._id, actionType: "restore" })}
                          disabled={working}
                        >
                          <FaTrashRestore size={11} /> Restore
                        </button>
                        {isAdmin && (
                          <button
                            className='btn btn-danger btn-sm'
                            onClick={() =>
                              setConfirm({
                                id: t._id,
                                actionType: "delete",
                                title: "Delete permanently?",
                                message: `"${t.title}" and its images will be deleted forever.`,
                                label: "Delete forever",
                                danger: true,
                              })
                            }
                          >
                            <FaTrashAlt size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => doAction(confirm)}
        loading={working}
        danger={confirm?.danger}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
      />
    </>
  );
};

export default Trash;
