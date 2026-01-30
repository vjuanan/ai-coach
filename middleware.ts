
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Define Paths
    const path = request.nextUrl.pathname;
    const isAuthPage = path.startsWith('/login') || path.startsWith('/auth');
    const isOnboardingPage = path.startsWith('/onboarding');
    const isPublic = path.startsWith('/api') || path.includes('.'); // Asset/API exclusions

    // 2. Auth Protection
    if (!user && !isAuthPage && !isPublic) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 3. RBAC & Onboarding Check (Only for authenticated users accessing app routes)
    if (user && !isPublic && !isAuthPage) {
        // Fetch User Profile to check Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role;

        // SCENARIO A: No Role -> Force Onboarding
        if (!role) {
            if (!isOnboardingPage) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
            return response; // Allow onboarding access
        }

        // SCENARIO B: Has Role -> Prevent accessing Onboarding
        if (role && isOnboardingPage) {
            return NextResponse.redirect(new URL(role === 'athlete' ? '/athlete/dashboard' : '/', request.url));
        }

        // SCENARIO C: Admin (Superuser)
        // Admins have access to everything. We don't block them.
        if (role === 'admin') {
            return response;
        }

        // SCENARIO D: Coach Checks
        if (role === 'coach') {
            // Block access to Client/Gym Management (Admin territory)
            if (path.startsWith('/gyms') || path.startsWith('/admin')) {
                // Redirect to safe dashboard
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // SCENARIO E: Athlete Checks
        if (role === 'athlete') {
            // Strict: Athletes go to /athlete/dashboard, Profile, etc.
            // Block Coach/Admin routes
            if (path === '/' || path.startsWith('/programs') || path.startsWith('/athletes') || path.startsWith('/gyms')) {
                return NextResponse.redirect(new URL('/athlete/dashboard', request.url));
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes, often public)
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
