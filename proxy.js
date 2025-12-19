import { NextResponse } from 'next/server'
import { auth } from './auth'

const protectedRoutes = ["/dashboard"]
const publicRoutesRedirectIfAuthed = ["/"]

export async function proxy(request) {

    const session = await auth()

    const { pathname } = request.nextUrl

    // 1) Ha van session és publikus oldalon vagyunk -> /dashboard
    const isPublicThatShouldRedirect = publicRoutesRedirectIfAuthed.includes(pathname)
    if (session && isPublicThatShouldRedirect) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // 2) Ha védett route és nincs session -> /
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtected && !session) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
}