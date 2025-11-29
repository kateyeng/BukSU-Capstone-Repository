import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

export function useBookmarks() {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/auth/me")).data,
    retry: false,
    select: (data) => {
      // normalize shape: support {user: {...}} or {...} or null
      if (!data) return null;
      return data.user ?? data;
    },
  });

  const list = useQuery({
    queryKey: ["bookmarks"],
    enabled: !!me.data && me.data.role === "teacher",
    queryFn: async () => (await api.get("/api/bookmarks")).data,
    retry: (count, err) => {
      const s = err?.response?.status;
      if (s === 401 || s === 403) return false;
      return count < 2;
    },
  });

  const add = useMutation({
    mutationFn: async (projectId) => { await api.post(`/api/bookmarks/${projectId}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const remove = useMutation({
    mutationFn: async (projectId) => { await api.delete(`/api/bookmarks/${projectId}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const ids = new Set((list.data || []).map((p) => String(p._id)));

  return { me, list, add, remove, ids };
}
