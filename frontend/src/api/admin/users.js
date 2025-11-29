// GET /api/admin/users
export async function getAdminUsers(req, res) {
    const users = await User.find().select("fullName email role createdAt editLock");

    const result = users.map((u) => {
        const lockActive =
            u.editLock &&
            u.editLock.lockedBy &&
            u.editLock.expiresAt &&
            u.editLock.expiresAt.getTime() > Date.now();

        return {
            _id: u._id,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            editLock: lockActive
                ? {
                    lockedBy: u.editLock.lockedBy,
                    expiresAt: u.editLock.expiresAt,
                }
                : null,
        };
    });

    res.json({ users: result });
}
