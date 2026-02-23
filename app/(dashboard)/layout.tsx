import { getAthleteAccessContext, getUserRole } from '@/lib/actions';
import { DashboardShell } from '@/components/app-shell/DashboardShell';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch role on server - this is INSTANT, no client-side loading flash!
    const role = await getUserRole();
    const athleteSidebar = role === 'athlete'
        ? await getAthleteAccessContext().then((ctx) => ({
            showMyCoach: ctx.visibility.showMyCoach,
            showMyGym: ctx.visibility.showMyGym,
            disableMyGymCard: ctx.visibility.disableMyGymCard
        }))
        : null;

    return (
        <DashboardShell role={role} athleteSidebar={athleteSidebar}>
            {children}
        </DashboardShell>
    );
}
