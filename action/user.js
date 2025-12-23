"use server"

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import { User } from "@/lib/database/models/User";
import { CreateUserSchema } from "@/lib/schemas/user";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// helpers -- start --------------------------------------------------------------------------------------------
function normalizeTokenState(userDoc) {
    const limit = Number(userDoc?.tokenLimit ?? 50000);
    const used = Number(userDoc?.tokensUsed ?? 0);
    const remaining = Math.max(0, limit - used);
    return { limit, used, remaining };
}

function toUserDto(user) {
    if (!user?._id) {
        throw new Error("Invalid user: missing _id");
    }

    const token = normalizeTokenState(user);

    return {
        id: String(user._id),
        name: user.name ?? "",
        email: user.email ?? "",
        status: user.status ?? "active",
        role: user.role ?? "user",
        mustChangePassword: user.mustChangePassword ?? true,
        passwordChangedAt: user.passwordChangedAt instanceof Date
            ? user.passwordChangedAt.toISOString()
            : (user.passwordChangedAt ? String(user.passwordChangedAt) : null),
        createdAt: user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : String(user.createdAt),
        updatedAt: user.updatedAt instanceof Date
            ? user.updatedAt.toISOString()
            : String(user.updatedAt),
        tokenLimit: token.limit,
        tokensUsed: token.used,
        tokensRemaining: token.remaining,
    };
}

function toUserDtos(users) {
    if (!Array.isArray(users)) {
        throw new Error("users must be an array");
    }

    return users.map(toUserDto);
}

function generatePasswordFromFullname(fullName) {
    if (!fullName) return null;

    // ékezetek leszedése, kisbetűsítés
    const normalized = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // diakritikák törlése
        .toLowerCase()
        .trim();

    // szóköz szerinti bontás (vezetéknév keresztnév, de kezeljük a több szavas nevet is)
    const parts = normalized.split(/\s+/).filter(Boolean);

    if (parts.length === 0) return null;

    // az 1, a 2 és a 2+ szavas neveket is kezeli
    return `${parts.join(".")}@playground`;

}
// helpers -- end -----------------------------------------------------------------------------------------------

export async function getMyTokenInfoAction() {
    const session = await auth();
    if (!session?.user?.id) {
        return { ok: false, error: "Nincs jogosultságod.", token: null };
    }

    try {
        await connectToDatabase();
        const user = await User.findById(session.user.id)
            .select("tokenLimit tokensUsed")
            .lean();

        if (!user) {
            return { ok: false, error: "Felhasználó nem található.", token: null };
        }

        return { ok: true, error: "", token: normalizeTokenState(user) };

    } catch (error) {
        console.error("get my token info action error", error)
        return { ok: false, error: "Server hiba" }
    }

}

export async function createUser(prevState, formData) {

    const rawFormData = Object.fromEntries(formData);

    // Zod validáció
    const parsed = CreateUserSchema.safeParse(rawFormData)

    if (!parsed.success) {

        const fieldErrors = {};

        // Zod hibák feldolgozása
        parsed.error.issues.forEach((issue) => {
            const fieldName = issue.path[0]; // 'fullname' vagy 'email'

            // Csak az első hibát tároljuk mezőnként (mint a Mongoose)
            if (!fieldErrors[fieldName]) {
                fieldErrors[fieldName] = issue.message;
            }
        });

        return {
            ok: false,
            error: "Validációs hiba",
            errors: fieldErrors,
            data: rawFormData,
        };
    }

    const { fullname, email } = parsed.data

    const plainPassword = generatePasswordFromFullname(fullname);
    if (!plainPassword) {
        return {
            ok: false,
            error: "Nem sikerült jelszót generálni.",
            data: parsed.data,
        };
    }

    try {
        await connectToDatabase()

        // const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

        await User.create({
            name: fullname,
            email,
            hashedPassword
        })

        revalidatePath("/dashboard/users");

        return { ok: true, error: "", message: "Felhasználó létrehozva.", data: {} }

    } catch (error) {
        console.error("create new user error", error)
        const fieldErrors = {};

        // Mongoose validációs hiba
        if (error.name === "ValidationError") {

            for (const field in error.errors) {
                fieldErrors[field] = error.errors[field].message;
            }

            return {
                ok: false,
                error: "Validációs hiba",
                errors: fieldErrors,
                data: parsed.data,
            };
        }

        // Mongoose validációs hiba - már létező email
        if (error?.code === 11000) {

            const field = Object.keys(error.keyPattern)[0]; // 'email'
            const fieldErrors = {};
            fieldErrors[field] = `Ez a(z) ${field} már létezik.`;

            return {
                ok: false,
                error: "Validációs hiba",
                errors: fieldErrors,
                data: parsed.data
            };
        }

        return { ok: false, error: "Server hiba", errors: fieldErrors, data: parsed.data }
    }
}

export async function getUsers() {

    const session = await auth();
    const role = session?.user?.role;

    if (!session?.user) {
        return { ok: false, error: "Nincs bejelentkezve.", data: [] }
    }
    if (role !== "admin") {
        return { ok: false, error: "Nincs jogosultság.", data: [] }
    }

    try {
        await connectToDatabase()

        const users = await User.find()

        return { ok: true, data: toUserDtos(users) }
    } catch (error) {
        console.error("get users error", error)
        return { ok: false, error: "Felhasználók lekérdezése sikertelen.", data: [] }
    }

}

export async function deleteUser(userId) {

    const session = await auth();
    const role = session?.user?.role;

    if (!session?.user) {
        return { ok: false, error: "Nincs bejelentkezve.", data: [] }
    }
    if (role !== "admin") {
        return { ok: false, error: "Nincs jogosultság.", data: [] }
    }

    try {
        await connectToDatabase()

        const result = await User.findByIdAndUpdate(
            userId,
            { status: "inactive" },
            { new: true }
        )

        if (!result) {
            return { ok: false, error: "Felhasználó nem található." }
        }

        revalidatePath("/dashboard/users");

        return { ok: true, message: "Felhasználó sikeresen inaktiválva." }

    } catch (error) {
        console.error("delete user error", error)
        return { ok: false, error: "Felhasználó törlése sikertelen." }
    }

}

export async function resetUserTokens(userId) {
    const session = await auth();
    const role = session?.user?.role;

    if (!session?.user) {
        return { ok: false, error: "Nincs bejelentkezve." };
    }
    if (role !== "admin") {
        return { ok: false, error: "Nincs jogosultság." };
    }

    try {
        await connectToDatabase();

        const result = await User.findByIdAndUpdate(
            userId,
            { $set: { tokensUsed: 0 } },
            { new: true }
        ).select("_id");

        if (!result) {
            return { ok: false, error: "Felhasználó nem található." };
        }

        revalidatePath("/dashboard/users");

        return { ok: true, message: "Tokenek sikeresen nullázva." };
    } catch (error) {
        console.error("reset user tokens error", error);
        return { ok: false, error: "Tokenek nullázása sikertelen." };
    }
}
