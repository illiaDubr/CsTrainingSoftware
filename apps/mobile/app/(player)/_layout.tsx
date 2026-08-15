import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';
import { AppShell } from '../../src/components/nav/AppShell';

export default function PlayerLayout() {
  return (
    <RoleGuard role="player">
      <AppShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AppShell>
    </RoleGuard>
  );
}
