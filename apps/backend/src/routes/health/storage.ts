import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

/** Рекурсивно считает файлы и их суммарный размер (с ограничением глубины) */
const scanDir = (dir: string, depth = 0): { files: number; bytes: number; newestMtime: string | null } => {
  let files = 0;
  let bytes = 0;
  let newest: number | null = null;

  if (depth > 4) return { files, bytes, newestMtime: null };

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return { files, bytes, newestMtime: null };
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = scanDir(full, depth + 1);
      files += sub.files;
      bytes += sub.bytes;
      if (sub.newestMtime) {
        const t = new Date(sub.newestMtime).getTime();
        if (newest === null || t > newest) newest = t;
      }
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(full);
        files += 1;
        bytes += stat.size;
        if (newest === null || stat.mtimeMs > newest) newest = stat.mtimeMs;
      } catch {
        // файл исчез между readdir и stat — пропускаем
      }
    }
  }

  return { files, bytes, newestMtime: newest ? new Date(newest).toISOString() : null };
};

/**
 * Определяет, лежит ли путь на отдельном примонтированном томе.
 * Читает /proc/mounts и ищет самую длинную точку монтирования, которая является префиксом пути.
 */
const findMountFor = (targetPath: string): { mountPoint: string; device: string; fsType: string } | null => {
  let raw: string;
  try {
    raw = fs.readFileSync('/proc/mounts', 'utf8');
  } catch {
    return null;
  }

  let best: { mountPoint: string; device: string; fsType: string } | null = null;

  for (const line of raw.split('\n')) {
    const [device, mountPoint, fsType] = line.split(' ');
    if (!mountPoint) continue;

    const isPrefix = targetPath === mountPoint || targetPath.startsWith(mountPoint.endsWith('/') ? mountPoint : mountPoint + '/');
    if (!isPrefix) continue;

    if (!best || mountPoint.length > best.mountPoint.length) {
      best = { mountPoint, device, fsType };
    }
  }

  return best;
};

/**
 * Диагностика файлового хранилища.
 * Показывает, переживут ли загруженные файлы редеплой:
 * если uploads лежит на Railway Volume — да, если на слое контейнера — нет.
 */
router.get('/storage', (_req, res) => {
  const volumeMountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH || null;
  const volumeName = process.env.RAILWAY_VOLUME_NAME || null;

  const uploadsExists = fs.existsSync(UPLOADS_ROOT);
  const stats = uploadsExists
    ? scanDir(UPLOADS_ROOT)
    : { files: 0, bytes: 0, newestMtime: null };

  const uploadsMount = findMountFor(UPLOADS_ROOT);
  const rootMount = findMountFor('/');

  // uploads на отдельном томе, если его точка монтирования отличается от корневой
  const onSeparateMount = !!uploadsMount && !!rootMount && uploadsMount.mountPoint !== rootMount.mountPoint;

  // Совпадает ли путь загрузок с примонтированным Railway-томом
  const uploadsInsideVolume = !!volumeMountPath && (
    UPLOADS_ROOT === volumeMountPath ||
    UPLOADS_ROOT.startsWith(volumeMountPath.endsWith('/') ? volumeMountPath : volumeMountPath + '/')
  );

  let verdict: string;
  if (uploadsInsideVolume) {
    verdict = 'PERSISTENT: папка загрузок находится внутри Railway Volume — файлы переживут редеплой';
  } else if (volumeMountPath && !uploadsInsideVolume) {
    verdict = `MISCONFIGURED: том примонтирован в ${volumeMountPath}, но файлы пишутся в ${UPLOADS_ROOT} — они будут теряться при редеплое`;
  } else if (onSeparateMount) {
    verdict = 'LIKELY PERSISTENT: папка загрузок на отдельном примонтированном разделе, но переменных Railway Volume нет — проверь настройки сервиса';
  } else {
    verdict = 'EPHEMERAL: тома нет, файлы лежат на слое контейнера и будут теряться при каждом редеплое';
  }

  res.json({
    success: true,
    data: {
      verdict,
      cwd: process.cwd(),
      uploadsPath: UPLOADS_ROOT,
      uploadsExists,
      totalFiles: stats.files,
      totalMB: Number((stats.bytes / 1024 / 1024).toFixed(2)),
      newestFileAt: stats.newestMtime,
      railwayVolume: {
        name: volumeName,
        mountPath: volumeMountPath,
        uploadsInsideVolume,
      },
      mounts: {
        uploads: uploadsMount,
        root: rootMount,
        onSeparateMount,
      },
      processStartedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      uptimeHours: Number((process.uptime() / 3600).toFixed(2)),
    },
  });
});

export default router;
