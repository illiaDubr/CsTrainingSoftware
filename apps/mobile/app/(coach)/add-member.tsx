import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../src/utils/alert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usersService } from '../../src/services/usersService';
import { groupsService } from '../../src/services/groupsService';

interface Player {
  id: number;
  username: string;
  email: string;
}

export default function AddMemberScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    // Пустой запрос — сразу грузим полный список, при вводе — с debounce
    const timeout = setTimeout(async () => {
      setSearching(true);

      try {
        const data = await usersService.searchPlayers(trimmed);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, trimmed ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleAdd = async (player: Player) => {
    setAddingId(player.id);

    try {
      await groupsService.addMember(Number(groupId), player.id);
      showAlert('Готово', `${player.username} добавлен в группу`);
      router.back();
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Не удалось добавить игрока';
      showAlert('Ошибка', message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Добавить игрока</Text>

      <TextInput
        style={styles.input}
        placeholder="Поиск по нику..."
        placeholderTextColor="#555"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoFocus
      />

      {searching && (
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 16 }} />
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleAdd(item)}
            disabled={addingId === item.id}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username[0].toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>

            {addingId === item.id ? (
              <ActivityIndicator color="#f59e0b" />
            ) : (
              <Text style={styles.addText}>Добавить</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !searching ? (
            <Text style={styles.emptyText}>Игроков не найдено</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  back: {
    color: '#f59e0b',
    fontSize: 15,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1d2e',
    borderWidth: 1,
    borderColor: '#2a2d3e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 40,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2d3e',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a1f00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  email: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  addText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
});
