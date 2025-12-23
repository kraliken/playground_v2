import { NextResponse } from 'next/server'
import { auth } from './auth'

const protectedRoutes = ["/dashboard"]
const publicRoutesRedirectIfAuthed = ["/"]

export async function proxy(request) {

    const url = request.nextUrl;
    const originalPathname = url.pathname;

    // Trailing slash normalizálása
    const pathname =
        originalPathname !== "/" && originalPathname.endsWith("/")
            ? originalPathname.slice(0, -1)
            : originalPathname;

    // 0) STATIKUS / BELSŐ ÚTVONALAK KIHAGYÁSA
    const isNextInternal = pathname.startsWith("/_next");
    const isApi = pathname.startsWith("/api");
    const isPublicFile = pathname.match(/\.[^/]+$/); // pl. .png, .ico, .js, .css

    if (isNextInternal || isApi || isPublicFile) {
        return NextResponse.next();
    }

    const session = await auth();

    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    const isHome = pathname === "/";
    const isLogin = pathname === "/login";
    const isDashboardRoot = pathname === "/dashboard";
    const isChangePassword = pathname === "/change-password";

    // ================
    // 1) NINCS SESSION
    // ================
    if (!session) {
        // Védett route → vissza főoldalra
        if (isProtected) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // /change-password ne legyen elérhető login nélkül
        if (isChangePassword) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Minden más publikus
        return NextResponse.next();
    }

    // ==========================
    // 2) VAN SESSION - extra infók
    // ==========================

    // INACTIVE BLOKKOLÁS (ide tedd!)
    const status = session?.user?.status ?? session?.status;

    if (status === "inactive") {
        // tipp: akár ide tehetsz egy logout route-ot is később
        return NextResponse.redirect(new URL("/?reason=inactive", request.url));
    }
    const mustChangePassword =
        session?.user?.mustChangePassword ??
        session?.mustChangePassword ??
        false;

    // ==========================
    // 3) KÖTELEZŐ JELSZÓCSERE
    // ==========================
    // console.log("mustChangePassword: ", mustChangePassword);
    if (mustChangePassword) {
        if (!isChangePassword) {
            return NextResponse.redirect(
                new URL("/change-password", request.url)
            );
        }

        // Ha már /change-password-on vagyunk → mehet tovább
        return NextResponse.next();
    }

    // ==========================
    // 4) NEM KELL MÁR JELSZÓCSERE
    // ==========================

    // Ha már nem kell jelszót cserélni, ne lehessen visszamenni
    if (isChangePassword) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const isHomeOrLogin = isHome || isLogin;

    // Bejelentkezve, és / vagy /login → dashboard
    if (isHomeOrLogin) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Védett route + van session → oké
    return NextResponse.next();

}