import { useBookmarks } from "./useBookmarks";

export default function BookmarkButton({ projectId, debug = false }) {
  const { me, ids, add, remove } = useBookmarks();
  if (debug) console.log("BookmarkButton user:", me.data);

  // Allow both teachers and students to bookmark
  if (!me.data || (me.data.role !== "teacher" && me.data.role !== "student")) return null;

  const isBookmarked = ids.has(String(projectId));
  const busy = add.isPending || remove.isPending;

  const toggle = async () => {
    try {
      if (isBookmarked) await remove.mutateAsync(projectId);
      else await add.mutateAsync(projectId);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Bookmark action failed";
      alert(msg);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={isBookmarked}
      title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
      className="btn-bookmark"
    >
      {isBookmarked ? "★ Saved" : "☆ Save"}
    </button>
  );
}
