import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function CommentSection({ projectId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchComments() {
    try {
      const res = await fetch(`${API}/api/comments?projectId=${projectId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error("Fetch comments error:", e);
    }
  }

  useEffect(() => {
    if (projectId) fetchComments();
  }, [projectId]);

  async function handleAddComment() {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId,
          content: newComment,
          page: page ? Number(page) : null,
          section: section.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      setComments([data.comment, ...comments]);
      setNewComment("");
      setPage("");
      setSection("");
      toast.success("Comment added");
    } catch (e) {
      console.error("Add comment error:", e);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`${API}/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setComments(comments.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (e) {
      console.error("Delete comment error:", e);
      toast.error("Failed to delete comment");
    }
  }

  async function handleResolveComment(commentId) {
    try {
      const res = await fetch(`${API}/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "resolved" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComments(comments.map((c) => (c._id === commentId ? data.comment : c)));
      toast.success("Comment resolved");
    } catch (e) {
      console.error("Resolve comment error:", e);
      toast.error("Failed to resolve comment");
    }
  }

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
        Feedback & Comments
      </h3>

      {/* Add Comment Form */}
      {currentUser?.role === "teacher" || currentUser?.role === "admin" ? (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: 8,
              fontFamily: "monospace",
              fontSize: 12,
              marginBottom: 8,
            }}
            rows="3"
            disabled={loading}
          />

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="number"
              placeholder="Page #"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              style={{
                flex: 0.5,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: 6,
                fontSize: 12,
              }}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Section (optional)"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{
                flex: 1,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: 6,
                fontSize: 12,
              }}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving…" : "Add Comment"}
          </button>
        </div>
      ) : null}

      {/* Comments List */}
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {comments.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 12, padding: 8 }}>
            No comments yet.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              style={{
                background: comment.status === "resolved" ? "#f0fdf4" : "#fff",
                border: `1px solid ${
                  comment.status === "resolved" ? "#dcfce7" : "#e5e7eb"
                }`,
                borderRadius: 4,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 6,
                }}
              >
                <div>
                  <strong style={{ fontSize: 12 }}>{comment.authorName}</strong>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {comment.page && `Page ${comment.page} `}
                    {comment.section && `• ${comment.section}`}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </div>
              </div>

              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  marginBottom: 8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {comment.content}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 11,
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: 6,
                }}
              >
                {comment.status !== "resolved" && (
                  <button
                    onClick={() => handleResolveComment(comment._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#059669",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ✓ Resolve
                  </button>
                )}
                {comment.status === "resolved" && (
                  <span style={{ color: "#059669" }}>✓ Resolved</span>
                )}
                {comment.author?._id === currentUser?._id && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
