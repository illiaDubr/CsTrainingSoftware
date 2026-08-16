import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TacticsListView } from '../../../../../src/components/tactics/TacticsListView';
import { FAB } from '../../../../../src/components/ui/FAB';
import { useGroupPermission } from '../../../../../src/hooks/useGroupPermission';
import { tacticsService } from '../../../../../src/services/tacticsService';
import { showAlert, showConfirm } from '../../../../../src/utils/alert';
import { Tactic } from '../../../../../src/types';

export default function GroupTacticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { canManage, pathPrefix } = useGroupPermission(Number(id));
  const groupId = Number(id);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🧠 Тактики</Text>
      <Text style={styles.subtitle}>Коллы на раунд: карта, гранаты и движение команды</Text>

      <TacticsListView
        groupId={groupId}
        onTacticPress={(tactic: Tactic) => router.push(`${pathPrefix}/group/${id}/tactics/${tactic.id}` as any)}
        onEdit={canManage ? (tactic: Tactic) => router.push(`${pathPrefix}/edit-tactic?groupId=${id}&tacticId=${tactic.id}` as any) : undefined}
        onDelete={canManage ? (tactic: Tactic, reload: () => void) => {
          showConfirm('Удалить тактику?', tactic.title, async () => {
            try {
              await tacticsService.deleteTactic(tactic.id);
              reload();
            } catch {
              showAlert('Ошибка', 'Не удалось удалить тактику');
            }
          });
        } : undefined}
        emptyHint={canManage ? 'Нажми «+», чтобы собрать первую тактику' : 'Тренер ещё не добавил тактики для команды'}
      />

      {canManage ? (
        <FAB onPress={() => router.push(`${pathPrefix}/create-tactic?groupId=${id}` as any)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D14', paddingTop: 60, paddingHorizontal: 20 },
  back: { color: '#f59e0b', fontSize: 15, marginBottom: 12 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 20 },
});
