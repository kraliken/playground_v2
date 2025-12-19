// lib/actions/auth.js
"use server"

import { signIn, signOut } from "@/auth"

export const SignInAction = async () => {
    await signIn("microsoft-entra-id", { redirectTo: "/dashboard" }, { prompt: "select_account" })
}
export const SignOutAction = async () => {
    await signOut({ redirectTo: "/" })
}