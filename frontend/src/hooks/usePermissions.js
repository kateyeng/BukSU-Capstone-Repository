import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const defaultPermissions = {
  project: {
    create: false,
    read: false,
    update: false,
    delete: false,
    download: false,
  },
  bookmark: {
    create: false,
    delete: false,
  },
  thesis: {
    view: false,
    approve: false,
    reject: false,
    edit: false,
  },
  user: {
    read: false,
    update: false,
    delete: false,
  },
};

export default function usePermissions() {
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [role, setRole] = useState("guest");
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingPermissions(true);

        const res = await fetch(`${API}/api/rbac/my-permissions`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (!cancelled) {
          setPermissions({
            ...defaultPermissions,
            ...(data?.permissions || {}),
            project: {
              ...defaultPermissions.project,
              ...(data?.permissions?.project || {}),
            },
            bookmark: {
              ...defaultPermissions.bookmark,
              ...(data?.permissions?.bookmark || {}),
            },
            thesis: {
              ...defaultPermissions.thesis,
              ...(data?.permissions?.thesis || {}),
            },
            user: {
              ...defaultPermissions.user,
              ...(data?.permissions?.user || {}),
            },
          });
          setRole(String(data?.role || "guest").toLowerCase());
        }
      } catch (err) {
        console.error("[usePermissions] failed:", err);
      } finally {
        if (!cancelled) setLoadingPermissions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const can = useMemo(
    () => ({
      projectCreate: !!permissions?.project?.create,
      projectRead: !!permissions?.project?.read,
      projectUpdate: !!permissions?.project?.update,
      projectDelete: !!permissions?.project?.delete,
      projectDownload: !!permissions?.project?.download,
      bookmarkCreate: !!permissions?.bookmark?.create,
      bookmarkDelete: !!permissions?.bookmark?.delete,
      thesisView: !!permissions?.thesis?.view,
      thesisApprove: !!permissions?.thesis?.approve,
      thesisReject: !!permissions?.thesis?.reject,
      thesisEdit: !!permissions?.thesis?.edit,
      userRead: !!permissions?.user?.read,
      userUpdate: !!permissions?.user?.update,
      userDelete: !!permissions?.user?.delete,
    }),
    [permissions]
  );

  return {
    role,
    permissions,
    loadingPermissions,
    can,
  };
}