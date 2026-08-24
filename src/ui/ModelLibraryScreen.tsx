/**
 * Model Library – القسم 18
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from './theme';
import { AICore } from '../ai-core/AICore';
import { ModelInfo } from '../types';

interface Props {
  aiCore: AICore;
  onBack: () => void;
  onModelChanged: () => void;
}

export function ModelLibraryScreen({ aiCore, onBack, onModelChanged }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const device = aiCore.modelManager.getDeviceInfo();

  useEffect(() => {
    setModels(aiCore.modelManager.listModels());
  }, []);

  const refresh = () => setModels(aiCore.modelManager.listModels());

  const handleDownload = async (model: ModelInfo) => {
    if (model.isBundled || model.status === 'installed') return;

    if (!aiCore.modelManager.canRunModel(model)) {
      Alert.alert(
        'Device Capability',
        `This model requires ~${model.ramRequirementGB} GB RAM. Your device is classified as ${device?.capability || 'UNKNOWN'} and may not run it safely.`
      );
      return;
    }

    setDownloadingId(model.id);
    setProgress(0);

    const result = await aiCore.modelManager.downloadModel(model.id, (p) => setProgress(p));
    setDownloadingId(null);

    if (!result.success) {
      Alert.alert('Download Failed', result.error || 'Model download failed. The model was not installed.');
    }
    refresh();
  };

  const handleSelect = async (model: ModelInfo) => {
    if (model.status !== 'installed') return;

    const ok = aiCore.modelManager.setActiveModel(model.id);
    if (!ok) {
      Alert.alert('Cannot run model', 'Insufficient memory or device capability for this model.');
      return;
    }

    await aiCore.runtime.load(model);
    onModelChanged();
    Alert.alert('Model Active', `${model.name} is now running locally.`);
  };

  const handleDelete = async (model: ModelInfo) => {
    if (model.isBundled) return;
    const result = await aiCore.modelManager.deleteModel(model.id);
    if (result.success) {
      refresh();
    } else {
      Alert.alert('Error', result.error || 'Could not delete');
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
  };

  const renderModel = ({ item }: { item: ModelInfo }) => {
    const isActive = aiCore.modelManager.getActiveModel()?.id === item.id;
    const canRun = aiCore.modelManager.canRunModel(item);
    const isDownloading = downloadingId === item.id;

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <Text style={styles.modelName}>{item.name}</Text>
          {item.isBundled && <Text style={styles.badge}>Bundled</Text>}
          {isActive && <Text style={[styles.badge, styles.badgeActive]}>Active</Text>}
        </View>

        <Text style={styles.meta}>
          {item.version} • {formatSize(item.sizeBytes)} • {item.quantization}
        </Text>
        <Text style={styles.meta}>RAM: ~{item.ramRequirementGB} GB • {canRun ? 'Compatible' : 'May not fit'}</Text>
        <Text style={styles.caps}>{item.capabilities.join(' • ')}</Text>

        <View style={styles.actions}>
          {item.status === 'installed' ? (
            <>
              {!isActive && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSelect(item)}>
                  <Text style={styles.btnText}>Use</Text>
                </TouchableOpacity>
              )}
              {!item.isBundled && (
                <TouchableOpacity style={styles.btnDanger} onPress={() => handleDelete(item)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </>
          ) : isDownloading ? (
            <View style={styles.progressRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btnPrimary, !canRun && styles.btnDisabled]}
              onPress={() => handleDownload(item)}
              disabled={!canRun}
            >
              <Text style={styles.btnText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Model Library</Text>
        <Text style={styles.deviceInfo}>
          Device: {device?.capability || '—'} • RAM ~{device?.ramGB || '?'} GB
        </Text>
      </View>

      <FlatList
        data={models}
        keyExtractor={(m) => m.id}
        renderItem={renderModel}
        contentContainerStyle={{ padding: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  deviceInfo: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: { borderColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  modelName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  badge: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textSecondary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeActive: { backgroundColor: colors.primary, color: '#fff' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  caps: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnDanger: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { color: colors.primary, fontSize: 13 },
});
