// frontend/src/api/teacher/projects.js
import api from "../axios";

/**
 * Upload a new thesis project (teacher/admin).
 * This sends multipart/form-data to: POST /api/teacher/projects
 *
 * Expected payload:
 * {
 *   title,
 *   category,   // e.g. department
 *   year,
 *   abstract,
 *   authors,    // string or array
 *   file,       // File object (PDF)
 *   adviser,
 *   department,
 *   keywords,
 *   status      // optional, default "pending"
 * }
 */
export function uploadProject({
  title,
  category,
  year,
  abstract,
  authors,
  file,
  adviser,
  department,
  keywords,
  status = "pending",
}) {
  const fd = new FormData();

  fd.append("title", title);
  fd.append("category", category);
  fd.append("year", year);
  fd.append("abstract", abstract);

  if (Array.isArray(authors)) {
    fd.append("authors", authors.join(", "));
  } else if (authors) {
    fd.append("authors", authors);
  }

  if (adviser) fd.append("adviser", adviser);
  if (department) fd.append("department", department);
  if (keywords) fd.append("keywords", keywords);
  if (status) fd.append("status", status);
  if (file) fd.append("file", file);

  return api.post("/api/student/projects", fd, {
    headers: {
      // VERY IMPORTANT: let axios set the boundary for FormData;
      // we just tell it it's multipart
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });
}
