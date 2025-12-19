// lib/auth/getUserIdOrResult.js

export async function getUserIdOrResult(authFn) {
    const session = await authFn();
    const userId = session?.user?.id;

    if (!userId) {
        return {
            ok: false,
            error: "Nincs bejelentkezve.",
            userId: null
        };
    }

    return {
        ok: true,
        error: null,
        userId,
        userName: session?.user?.name || "",
        userEmail: session?.user?.email || ""
    };
}