import { useState } from "react";
import { toast } from "sonner";
import {
  useReviewTaskMutation,
  useSubmitTaskMutation,
} from "../../redux/slices/api/taskApiSlice";
import ImagePicker, { useImageUpload } from "../ImagePicker";
import { Field, Modal, Spinner } from "../ui";

// Employee: submit finished work (note + photos) for admin review
export const SubmitModal = ({ task, onClose }) => {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadFiles, uploading] = useImageUpload();
  const [submitTask, { isLoading }] = useSubmitTaskMutation();

  const busy = uploading || isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return toast.error("Please write what you did");

    try {
      const images = await uploadFiles(files);
      const res = await submitTask({ id: task._id, note: note.trim(), images }).unwrap();
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Could not submit the work");
    }
  };

  return (
    <Modal open onClose={busy ? () => {} : onClose} title='Submit work for review'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {task.reviewNote && (
          <div className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'>
            <p className='font-bold'>Admin feedback on your last submission</p>
            <p className='mt-1'>{task.reviewNote}</p>
          </div>
        )}

        <Field label='What did you do?' hint='Explain the work you finished, any problem you faced, etc.'>
          <textarea
            rows={5}
            className='input'
            placeholder='e.g. Completed the report, checked all numbers and attached screenshots.'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </Field>

        <Field label='Proof photos (optional)'>
          <ImagePicker files={files} setFiles={setFiles} />
        </Field>

        <div className='flex justify-end gap-2 pt-2'>
          <button type='button' className='btn btn-secondary' onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type='submit' className='btn btn-primary' disabled={busy}>
            {busy && <Spinner />} Submit for review
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Admin: approve (complete) or send back with a remark
export const ReviewModal = ({ task, mode, onClose }) => {
  const [remark, setRemark] = useState("");
  const [reviewTask, { isLoading }] = useReviewTaskMutation();
  const approve = mode === "approve";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!approve && !remark.trim()) return toast.error("Write what needs to be corrected");

    try {
      const res = await reviewTask({
        id: task._id,
        action: approve ? "approve" : "reject",
        remark: remark.trim(),
      }).unwrap();
      toast.success(res.message);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Could not review the task");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={approve ? "Approve & complete task" : "Send back for changes"}
      size='max-w-md'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <p className='muted text-sm'>
          {approve
            ? `Mark "${task.title}" as completed? The employee will be notified.`
            : "The task goes back to the employee as 'In Progress' with your feedback."}
        </p>
        <Field label={approve ? "Remark (optional)" : "What needs to be corrected?"}>
          <textarea
            rows={4}
            className='input'
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={approve ? "Good work!" : "e.g. Numbers in the 3rd table are wrong."}
          />
        </Field>
        <div className='flex justify-end gap-2 pt-1'>
          <button type='button' className='btn btn-secondary' onClick={onClose}>
            Cancel
          </button>
          <button
            type='submit'
            disabled={isLoading}
            className={`btn ${approve ? "btn-success" : "btn-danger"}`}
          >
            {isLoading && <Spinner />} {approve ? "Approve & complete" : "Send back"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
