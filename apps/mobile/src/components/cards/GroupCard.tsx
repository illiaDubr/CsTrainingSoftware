import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  name: string;
  description?: string;
  onPress: () => void;
}

export function GroupCard({ name, description, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>👥</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2d3e',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2a1f00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  description: { color: '#888', fontSize: 13 },
  arrow: { color: '#555', fontSize: 24 },
});