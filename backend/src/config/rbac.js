// backend/src/config/rbac.js
import { RBAC } from "rbac";

// --- Static role + permission model (what exists in the system) ---

export const roles = ["guest", "student", "teacher", "admin"];

// resource -> [actions]
const permissionsMap = {
    project: ["create", "read", "update", "delete", "download"],
    bookmark: ["create", "delete"],
    user: ["read", "update", "delete"],
    thesis: ["view", "approve", "reject", "edit"], // NEW
};

// Default grants (canonical form: "resource:action")
let grants = {
    guest: [
        // e.g. "thesis:view" later if you want
    ],

    student: [
        "project:create",
        "project:read",
        "project:update",
        "project:download",
        "bookmark:create",
        "bookmark:delete",
        // optional: allow students to see thesis list
        "thesis:view",
    ],

    // Teacher permissions you asked for
    teacher: [
        "thesis:view",
        "thesis:approve",
        "thesis:reject",
        "thesis:edit",
    ],

    // Admin gets everything
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

// Current RBAC instance (from the npm package)
let rbacInstance = null;

/* ============================
   Helpers
============================ */

// Flatten permissionsMap -> ["project:create", "project:read", ...]
function flattenPermissions(map) {
    return Object.entries(map).flatMap(([resource, actions]) =>
        actions.map((a) => `${resource}:${a}`)
    );
}

// Convert "resource:action" -> "action_resource" for the library
function toLibPermissionId(resource, action) {
    return `${action}_${resource}`;
}

// Build options object for the RBAC constructor from our grants
function buildRbacOptions() {
    // Library wants "permissions" in { resource: [actions] } form
    const permissions = permissionsMap;

    // Convert our grants (resource:action) into action_resource strings
    const allAllowed = new Set(flattenPermissions(permissionsMap));

    const libGrants = {};
    for (const role of roles) {
        const list = Array.isArray(grants[role]) ? grants[role] : [];
        libGrants[role] = list
            .filter((perm) => allAllowed.has(perm))
            .map((perm) => {
                const [resource, action] = perm.split(":");
                return toLibPermissionId(resource, action);
            });
    }

    return {
        roles,
        permissions,
        grants: libGrants,
    };
}

/* ============================
   Public API used elsewhere
============================ */

// Build or rebuild RBAC instance
async function initRBAC() {
    const opts = buildRbacOptions();
    const rbac = new RBAC(opts);
    await rbac.init(); // required by this package
    rbacInstance = rbac;
}

export async function getRBAC() {
    if (!rbacInstance) {
        await initRBAC();
    }
    return rbacInstance;
}

// Data for your Admin Role Permissions UI
export function getRbacConfig() {
    const permissions = flattenPermissions(permissionsMap);
    return {
        roles,
        permissions,
        grants,
    };
}

// Called by the admin API when you click "Save Changes" in UI
export async function updateRbacGrants(newGrants) {
    const allowedPermissions = new Set(flattenPermissions(permissionsMap));
    const cleanGrants = {};

    for (const role of roles) {
        const list = Array.isArray(newGrants[role]) ? newGrants[role] : [];
        cleanGrants[role] = list.filter((perm) => allowedPermissions.has(perm));
    }

    grants = cleanGrants;
    await initRBAC(); // rebuild the RBAC instance with new grants

    return getRbacConfig();
}

// Convenience helper used by middleware
export async function canRole(role, resource, action) {
    const rbac = await getRBAC();
    return rbac.can(role, action, resource); // (role, action, resource)
}
