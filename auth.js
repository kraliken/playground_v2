import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import Credentials from "next-auth/providers/credentials"
import client from "./lib/database/connection/db"
import { connectToDatabase } from "./lib/database/connection/mongoose"
import { User } from "./lib/database/models/User"
import bcrypt from "bcryptjs"

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

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: MongoDBAdapter(client),
    session: {
        strategy: "jwt",
    },
    providers: [
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials

                await connectToDatabase()

                const user = await User.findOne({ email })
                    .select("+hashedPassword")
                    .exec()

                if (!user || user.status === "inactive") {
                    return null
                }

                const isValid = await bcrypt.compare(password, user.hashedPassword)
                if (!isValid) {
                    // rossz jelszó
                    return null
                }

                // Amit itt visszaadsz, az megy tovább a jwt callbackhez
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    mustChangePassword: user.mustChangePassword,
                    status: user.status,
                }
            }
        })
    ],
    events: {
        async createUser(data) {

            const now = new Date();

            // a password létrehozása és hashelése
            const plainPassword = generatePasswordFromFullname(data.user.name);

            // hibát adni, ha nem sikerül plainPassword-öt generálni
            const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
            const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

            // console.log(data.user.email);
            const db = client.db()
            await db.collection("users").updateOne(
                { email: data.user.email },
                {
                    $set: {
                        hashedPassword: hashedPassword,
                        status: "active",
                        role: "user",
                        mustChangePassword: true,
                        passwordChangedAt: null,
                        createdAt: now,
                        updatedAt: now,
                    },
                },
                { upsert: true }
            )
        },
    },
    callbacks: {
        async jwt({ token, user }) {

            if (user) {
                token.id = user.id

                try {
                    await connectToDatabase();
                    const dbUser = await User.findOne({ _id: user.id }).exec();
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.mustChangePassword = dbUser.mustChangePassword;
                        token.status = dbUser.status;
                    } else {
                        // Fallback az authorize()-ból jött user-re
                        token.role = user.role;
                        token.mustChangePassword = user.mustChangePassword;
                        token.status = user.status;
                    }
                } catch (err) {
                    console.error("JWT callback DB error:", err);
                    token.role = user.role;
                    token.mustChangePassword = user.mustChangePassword;
                    token.status = user.status;
                }
            }
            return token
        },
        async session({ session, token, user }) {
            if (token) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.mustChangePassword = token.mustChangePassword
                session.user.status = token.status
            }
            return session
        },
    }
})