import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client from "./lib/database/connection/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: MongoDBAdapter(client),
    providers: [
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token?.userId) {
                session.user.id = String(token.userId);
            }
            return session;
        },
    }
})