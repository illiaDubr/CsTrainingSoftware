import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';

export default function CoachLayout() {
  return (
    <RoleGuard role="coach">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
