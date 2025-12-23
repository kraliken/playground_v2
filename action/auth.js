"use server"

import { signIn, signOut } from "@/auth"
import { connectToDatabase } from "@/lib/database/connection/mongoose"
import { User } from "@/lib/database/models/User"
import { SignInSchema } from "@/lib/schemas/auth.schemas"
import { redirect } from "next/navigation"


export const SignInAction = async (provider) => {
    await signIn(provider, { redirectTo: "/dashboard" }, { prompt: "select_account" })
}

export const SignInWithCredentialsAction = async (prevState, formData) => {

    const rawFormData = Object.fromEntries(formData);
    const parsed = SignInSchema.safeParse(rawFormData)

    if (!parsed.success) {

        const fieldErrors = {};

        // Zod hibák feldolgozása
        parsed.error.issues.forEach((issue) => {
            const fieldName = issue.path[0]; // 'email' vagy 'password'

            // Csak az első hibát tároljuk mezőnként (mint a Mongoose)
            if (!fieldErrors[fieldName]) {
                fieldErrors[fieldName] = issue.message;
            }
        });

        return {
            ok: false,
            errors: fieldErrors,
            data: rawFormData,
        };

    }

    const { email, password } = parsed.data

    try {

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        if (result && result.error) {

            console.log("result.error: ", result.error);
            return {
                ok: false,
                errorMessage: "Hibás email vagy jelszó.",
                data: {
                    email,
                },
            }
        }

    } catch (error) {
        console.log("error in SignInWithCredentialsAction", error.code);
        if (error.code === 'credentials') {
            return {
                ok: false,
                errorMessage: "Hibás email vagy jelszó.",
                data: {
                    email,
                },
            }
        }
        return {
            ok: false,
            error: "Váratlan hiba történt. Próbáld újra később.",
            data: {
                email,
            },
        }
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select("mustChangePassword");

    if (user && user.mustChangePassword) {
        redirect("/change-password");
    }

    redirect("/dashboard")
}

export const SignOutAction = async () => {
    await signOut({ redirectTo: "/" })
}