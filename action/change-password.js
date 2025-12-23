"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth, signIn } from "@/auth";         // ugyanaz a csomag, ahonnan a signIn jön
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import { User } from "@/lib/database/models/User";

export async function changePassword(prevState, formData) {
    const currentPassword = formData.get("currentPassword")?.trim();
    const newPassword = formData.get("newPassword")?.trim();
    const newPasswordConfirm = formData.get("newPasswordConfirm")?.trim();

    // Alap szerveroldali validációk
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
        return {
            ok: false,
            message: "Minden mező kitöltése kötelező.",
        };
    }

    if (newPassword.length < 8) {
        return {
            ok: false,
            message: "Az új jelszónak legalább 8 karakter hosszúnak kell lennie.",
        };
    }

    if (newPassword !== newPasswordConfirm) {
        return {
            ok: false,
            message: "Az új jelszó és a megerősítés nem egyezik.",
        };
    }

    // Aktuális user lekérése sessionből
    const session = await auth();

    if (!session?.user?.email) {
        // Ha nincs bejelentkezett user, visszadobjuk a loginra
        redirect("/");
    }

    // DB kapcsolat
    await connectToDatabase();

    // User + passwordHash lekérése (mert select: false a schema-ban)
    const user = await User.findOne({ email: session.user.email }).select("+hashedPassword");

    if (!user) {
        // Biztonság: ne áruljuk el, hogy nincs user → generikus hiba
        return {
            ok: false,
            message: "Nem sikerült frissíteni a jelszót. Próbáld meg később.",
        };
    }

    // Jelenlegi jelszó ellenőrzése
    const isCurrentValid = await bcrypt.compare(currentPassword, user.hashedPassword);

    if (!isCurrentValid) {
        return {
            ok: false,
            message: "A jelenlegi jelszó nem helyes.",
        };
    }

    // Ne engedjük, hogy az új = régi
    const isSameAsOld = await bcrypt.compare(newPassword, user.hashedPassword);

    if (isSameAsOld) {
        return {
            ok: false,
            message: "Az új jelszó nem lehet ugyanaz, mint a régi.",
        };
    }

    // Új jelszó hash-elése
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    user.hashedPassword = newHash;

    await user.save();


    // ⬇️ automatikus "újra-login" az új jelszóval
    await signIn("credentials", {
        email: session.user.email,
        password: newPassword,
        redirect: false,      // ne a signIn irányítson, hanem te
    });

    // Most már az új JWT-ben mustChangePassword = false, a proxy is ezt látja
    redirect("/dashboard");

}