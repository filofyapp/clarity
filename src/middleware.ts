import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that should NEVER call Supabase auth (no getUser(), no session refresh)
// This prevents unnecessary auth requests for public pages.
const PUBLIC_PREFIXES = [
    '/landing',
    '/ip/',
    '/seguimiento/',
    '/api/inspeccion-remota/',
    '/api/cron/',
];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Short-circuit: public routes skip auth entirely (no Supabase call)
    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
