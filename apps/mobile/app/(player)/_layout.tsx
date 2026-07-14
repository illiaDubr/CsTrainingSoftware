import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';

export default function PlayerLayout() {
  return (
    <RoleGuard role="player">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
