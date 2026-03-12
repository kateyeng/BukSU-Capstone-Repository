import toast from "react-hot-toast";

/**
 * Wrap a promise (usually axios) with a loading/success/error toast.
 *
 * Example:
 *   await toastRequest(
 *     api.post("/api/auth/login", {...}),
 *     {
 *       loading: "Logging in...",
 *       success: (res) => res.data.message || "Logged in!",
 *       error: (err) => err.response?.data?.message || "Something went wrong",
 *     }
 *   );
 */
export async function toastRequest(promise, messages = {}) {
    const {
        loading = "Please wait...",
        success = (res) => res?.data?.message || "Success",
        error = (err) => err?.response?.data?.message || "Something went wrong",
    } = messages;

    return toast.promise(
        promise,
        {
            loading,
            success,
            error,
        },
        {
            // optional global options
            duration: 3000,
        }
    );
}
