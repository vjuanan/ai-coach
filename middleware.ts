
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // 1. Define Paths & Check Public
    // We check this FIRST to avoid expensive Supabase initialization on static assets/API
    const path = request.nextUrl.pathname;
    const isPublic = path.startsWith('/api') || path.includes('.'); // Asset/API exclusions

    if (isPublic) {
        return NextResponse.next();
    }

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

    // Only fetch user for protected routes
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Define Context
    const isAuthPage = path.startsWith('/login') || path.startsWith('/auth');
    const isOnboardingPage = path.startsWith('/onboarding');

    // 3. Auth Protection
    if (!user && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. RBAC & Onboarding Check (Only for authenticated users accessing app routes)
    if (user && !isAuthPage) {
        let role = null;

        // OPTIMIZATION: Check for cached role in cookies
        const roleCookie = request.cookies.get('user_role');
        if (roleCookie && roleCookie.value) {
            const [cookieUserId, cookieRole] = roleCookie.value.split(':');
            // Verify the cookie belongs to the current user
            if (cookieUserId === user.id) {
                role = cookieRole;
            }
        }

        // If no valid cached role, fetch from DB
        if (!role) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            role = profile?.role;

            // Cache the role for future requests
            if (role) {
                const cookieValue = `${user.id}:${role}`;
                // Set in response to client
                response.cookies.set({
                    name: 'user_role',
                    value: cookieValue,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7 // 1 week
                });

                // Also update the request cookies for immediate downstream use if needed
                // (Though we mainly stick to the `role` variable here)
            }
        }

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
