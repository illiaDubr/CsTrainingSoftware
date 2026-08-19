import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';
import { AppShell } from '../../src/components/nav/AppShell';

export default function AdminLayout() {
  return (
    <RoleGuard role="admin">
      <AppShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AppShell>
    </RoleGuard>
  );
}
