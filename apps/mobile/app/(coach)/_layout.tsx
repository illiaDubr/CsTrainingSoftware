import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';
import { AppShell } from '../../src/components/nav/AppShell';

export default function CoachLayout() {
  return (
    <RoleGuard role="coach">
      <AppShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AppShell>
    </RoleGuard>
  );
}
