import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Material } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  video: '🎥',
  document: '📄',
  link: '🔗',
  image: '🖼️',
};

const TYPE_LABELS: Record<string, string> = {
  video: 'Видео',
  document: 'Документ',
  link: 'Ссылка',
  image: 'Изображение',
};

interface Props {
  material: Material;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function MaterialCard({ material, onDelete, onEdit }: Props) {
  const handleOpen = () => {
    if (material.external_url) {
      Linking.openURL(material.external_url);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleOpen} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{TYPE_ICONS[material.type]}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{material.title}</Text>
        {material.description ? (
          <Text style={styles.description} numberOfLines={2}>{material.description}</Text>
        ) : null}
        <Text style={styles.type}>{TYPE_LABELS[material.type]}</Text>
      </View>
      {onEdit ? (
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={styles.editText}>✎</Text>
        </TouchableOpacity>
      ) : null}
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d2e', borderRadius: 14,
    padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2d3e',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#2a1f00',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  icon: { fontSize: 18 },
  content: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  description: { color: '#888', fontSize: 12, marginBottom: 4 },
  type: { color: '#666', fontSize: 11 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#666', fontSize: 16 },
  editBtn: { padding: 8 },
  editText: { color: '#f59e0b', fontSize: 15 },
});