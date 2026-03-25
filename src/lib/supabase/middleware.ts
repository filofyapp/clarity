import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Use getUser() instead of getSession().
    // getUser() contacts the Supabase Auth API which:
    // 1. Validates the JWT token
    // 2. Refreshes the access_token using the refresh_token if expired
    // 3. Mutates supabaseResponse cookies (sets new tokens or clears dead ones)
    // This is REQUIRED by Supabase SSR docs to prevent redirect loops from stale tokens.
    // Performance: config.matcher in middleware.ts ensures this only runs for real navigations,
    // not for static assets. React.cache() on getUsuarioActual() prevents duplicate calls in pages.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

    // Note: Public routes (/landing, /ip/, /seguimiento/, /api/inspeccion-remota/, /api/cron/)
    // are short-circuited in middleware.ts BEFORE this function is called.
    // Only /login and authenticated routes reach here.

    if (!user && !isAuthRoute) {
        // No valid session — redirect to /login.
        // CRITICAL: We must propagate the cookies from supabaseResponse to the redirect.
        // When getUser() fails, Supabase SSR clears the dead session cookies in supabaseResponse.
        // If we don't copy those cookies to the redirect response, the browser keeps the dead
        // cookies, and on the next navigation the middleware sees them again → redirect loop.
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const redirectResponse = NextResponse.redirect(url)

        // Copy ALL cookies from the mutated supabaseResponse to the redirect
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
                ...cookie,
            })
        })

        return redirectResponse
    }

    if (user && isAuthRoute) {
        // user is already logged in, redirect away from login
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}
