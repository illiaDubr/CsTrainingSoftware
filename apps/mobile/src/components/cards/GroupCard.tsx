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
    backgroundColor: '#151827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242A40',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  name: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  description: { color: '#94A3B8', fontSize: 13 },
  arrow: { color: '#5B677D', fontSize: 24 },
});
