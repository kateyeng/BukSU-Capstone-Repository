// backend/src/config/rbac.js
import RbacModel from "../models/rbac.model.js";

export const roles = ["guest", "student", "teacher", "admin"];

export const permissionsMap = {
  project: ["create", "read", "update", "delete", "download"],
  bookmark: ["create", "delete"],
  user: ["read", "update", "delete"],
  thesis: ["view", "approve", "reject", "edit"],
};

const defaultGrants = {
  guest: [],

  student: [
    "project:create",
    "project:read",
    "project:update",
    "project:download",
    "bookmark:create",
    "bookmark:delete",
    "thesis:view",
  ],

  teacher: [
    "thesis:view",
    "thesis:approve",
    "thesis:reject",
    "thesis:edit",
  ],

  admin: [
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:download",
    "bookmark:create",
    "bookmark:delete",
    "user:read",
    "user:update",
    "user:delete",
    "thesis:view",
    "thesis:approve",
    "thesis:reject",
    "thesis:edit",
  ],
};

let grants = JSON.parse(JSON.stringify(defaultGrants));

function flattenPermissions(map) {
  return Object.entries(map).flatMap(([resource, actions]) =>
    actions.map((action) => `${resource}:${action}`)
  );
}

function sanitizeGrants(inputGrants = {}) {
  const allowedPermissions = new Set(flattenPermissions(permissionsMap));
  const clean = {};

  for (const role of roles) {
    const rawList = Array.isArray(inputGrants?.[role]) ? inputGrants[role] : [];
    clean[role] = rawList.filter(
      (perm) => typeof perm === "string" && allowedPermissions.has(perm)
    );
  }

  return clean;
}

export function getRbacConfig() {
  return {
    roles,
    permissions: flattenPermissions(permissionsMap),
    grants,
  };
}

export async function loadRbacFromDB() {
  try {
    const doc = await RbacModel.findOne({ key: "global_rbac" }).lean();

    if (!doc || !doc.grants) {
      grants = JSON.parse(JSON.stringify(defaultGrants));
      return getRbacConfig();
    }

    grants = sanitizeGrants(doc.grants);
    return getRbacConfig();
  } catch (error) {
    console.error("[RBAC][LOAD][ERROR]", error);
    grants = JSON.parse(JSON.stringify(defaultGrants));
    return getRbacConfig();
  }
}

export async function saveRbacToDB(newGrants) {
  const cleanGrants = sanitizeGrants(newGrants);

  await RbacModel.findOneAndUpdate(
    { key: "global_rbac" },
    {
      key: "global_rbac",
      grants: cleanGrants,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  grants = cleanGrants;
  return getRbacConfig();
}

export async function resetRbacToDefault() {
  grants = JSON.parse(JSON.stringify(defaultGrants));

  await RbacModel.findOneAndUpdate(
    { key: "global_rbac" },
    {
      key: "global_rbac",
      grants,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return getRbacConfig();
}

export async function updateRbacGrants(newGrants) {
  return saveRbacToDB(newGrants);
}

export async function canRole(role, resource, action) {
  const safeRole = String(role || "guest").toLowerCase();
  const permission = `${resource}:${action}`;
  const roleGrants = grants[safeRole] || [];
  return roleGrants.includes(permission);
}