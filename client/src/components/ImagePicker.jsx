import { useEffect, useMemo } from "react";
import { BiImages } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import { useUploadImagesMutation } from "../redux/slices/api/taskApiSlice";
import { fileUrl } from "../utils";

const MAX_FILES = 6;
const MAX_MB = 5;

// Chooses image files (does not upload). Parent keeps `files` state.
// existing = urls already saved on the server, onRemoveExisting(index)
const ImagePicker = ({ files, setFiles, existing = [], onRemoveExisting }) => {
  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files]
  );

  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews]
  );

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const ok = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
      } else if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} is bigger than ${MAX_MB} MB`);
      } else ok.push(f);
    }
    const all = [...files, ...ok];
    if (existing.length + all.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} images allowed`);
      return setFiles(all.slice(0, Math.max(0, MAX_FILES - existing.length)));
    }
    setFiles(all);
  };

  const total = existing.length + files.length;

  return (
    <div>
      <div className='flex flex-wrap gap-3'>
        {existing.map((src, i) => (
          <div key={src + i} className='relative'>
            <img src={fileUrl(src)} alt='' className='h-20 w-20 rounded-lg border border-slate-200 object-cover dark:border-[#2d3750]' />
            {onRemoveExisting && (
              <button
                type='button'
                onClick={() => onRemoveExisting(i)}
                className='absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white'
              >
                <MdClose size={12} />
              </button>
            )}
          </div>
        ))}

        {previews.map((p, i) => (
          <div key={p.url} className='relative'>
            <img src={fileUrl(p.url)} alt={p.name} className='h-20 w-20 rounded-lg border border-indigo-400 object-cover' />
            <button
              type='button'
              onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
              className='absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white'
            >
              <MdClose size={12} />
            </button>
          </div>
        ))}

        {total < MAX_FILES && (
          <label className='flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-[#2d3750] dark:text-slate-400'>
            <BiImages size={22} />
            <span className='text-[11px] font-semibold'>Add photo</span>
            <input
              type='file'
              accept='image/png,image/jpeg,image/webp,image/gif'
              multiple
              className='hidden'
              onChange={onPick}
            />
          </label>
        )}
      </div>
      <p className='muted mt-2 text-xs'>
        JPG / PNG / WEBP, up to {MAX_MB} MB each, max {MAX_FILES} photos.
      </p>
    </div>
  );
};

export default ImagePicker;

// returns [uploadFiles(files) -> Promise<string[]>, isUploading]
// Files are saved on YOUR server (server/uploads), not on any third-party storage.
export const useImageUpload = () => {
  const [upload, { isLoading }] = useUploadImagesMutation();

  const uploadFiles = async (files) => {
    if (!files.length) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    const res = await upload(fd).unwrap();
    return res.urls;
  };

  return [uploadFiles, isLoading];
};
