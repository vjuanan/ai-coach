
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Timeout helper to prevent middleware from hanging indefinitely
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
}

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

    // Only fetch user for protected routes - with timeout protection (8s max)
    const authResult = await withTimeout(
        supabase.auth.getUser(),
        8000,
        { data: { user: null }, error: new Error('Auth timeout') } as any
    );
    const user = authResult.data?.user;

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
        let onboardingCompleted = false;

        // OPTIMIZATION: Check for cached role in cookies
        const roleCookie = request.cookies.get('user_role');
        if (roleCookie && roleCookie.value) {
            // Format: userId:role:onboardingCompleted
            const parts = roleCookie.value.split(':');
            if (parts.length >= 2) {
                const [cookieUserId, cookieRole, cookieStatus] = parts;
                // Verify the cookie belongs to the current user
                if (cookieUserId === user.id) {
                    role = cookieRole;
                    // Backward compatibility: If no status in cookie, fetch from DB
                    if (cookieStatus === 'true') {
                        onboardingCompleted = true;
                    } else if (cookieStatus === 'false') {
                        onboardingCompleted = false;
                    } else {
                        // Old cookie format, force fetch
                        role = null;
                    }
                }
            }
        }

        // If no valid cached role or status, fetch from DB - with timeout protection (5s max)
        if (!role) {
            const profileResult = await withTimeout(
                Promise.resolve(
                    supabase
                        .from('profiles')
                        .select('role, onboarding_completed')
                        .eq('id', user.id)
                        .single()
                ),
                5000,
                { data: null, error: new Error('Profile fetch timeout') } as any
            );
            const profile = profileResult.data;

            role = profile?.role;
            onboardingCompleted = profile?.onboarding_completed ?? false;

            // Cache the role for future requests
            if (role) {
                const cookieValue = `${user.id}:${role}:${onboardingCompleted}`;
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

                // CRITICAL FIX: Also set on request cookies so Server Components (layout.tsx) see it IMMEDIATELY
                request.cookies.set({
                    name: 'user_role',
                    value: cookieValue,
                });
            }
        }

        // If role couldn't be determined (timeout or error), allow through (page-level auth will catch)
        if (!role) {
            return response;
        }

        // SCENARIO A: Not Completed Onboarding -> Force Onboarding
        // Even if they have a role (e.g. default athlete), they must finish onboarding.
        if (!onboardingCompleted) {
            if (!isOnboardingPage) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
            return response; // Allow onboarding access
        }

        // SCENARIO B: Has Completed Onboarding -> Prevent accessing Onboarding
        if (onboardingCompleted && isOnboardingPage) {
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
