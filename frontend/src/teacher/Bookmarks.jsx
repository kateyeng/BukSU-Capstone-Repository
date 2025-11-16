import { useBookmarks } from "../hooks/useBookmarks";
import { Link } from "react-router-dom";

export default function TeacherBookmarks() {
  const { me, list } = useBookmarks();

  if (!me.data) return <p>Loading…</p>;
  if (me.data.role !== "teacher") return <p>Only teachers can view bookmarks.</p>;

  if (list.isLoading) return <p>Loading bookmarks…</p>;
  if (list.isError) return <p>Failed to load bookmarks.</p>;

  const items = list.data || [];

  return (
    <div className="p-4">
      <h2>My Bookmarked Documents</h2>
      {items.length === 0 ? (
        <p>No saved documents yet.</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li key={p._id}>
              <strong>{p.title}</strong> ({p.year}) – {p.category} &nbsp;
              <Link to={`/teacher/details/${p._id}`}>Open</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
