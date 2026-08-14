import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as nadesService from '../../services/nades/nades.service';

const SIDES = ['T', 'CT'];
const CATEGORIES = ['base', 'default', 'extra'];
const NADE_TYPES = ['smoke', 'flash', 'molotov', 'he'];
const IMAGE_TYPES = ['position', 'aim', 'result', 'other'];

const filesToImages = (req: AuthRequest): { path: string; image_type: string }[] => {
  const files = (req.files as Express.Multer.File[]) || [];
  let types: string[] = [];
  try {
    const raw = (req.body as any).image_types;
    types = raw ? JSON.parse(raw) : [];
  } catch {
    types = [];
  }
  return files.map((f, i) => ({
    path: `/uploads/nades/${f.filename}`,
    image_type: IMAGE_TYPES.includes(types[i]) ? types[i] : 'other',
  }));
};

const parsePos = (v: any): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0 || n > 1) return undefined;
  return n;
};

export const getNadeMapsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const maps = await nadesService.getNadeMaps(Number(groupId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: maps });
  } catch (err) { next(err); }
};

export const getNadesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId, mapName } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    if (!mapName) return res.status(400).json({ success: false, message: 'mapName is required' });
    const nades = await nadesService.getNadesByMap(Number(groupId), req.user!.userId, req.user!.role, String(mapName));
    res.json({ success: true, data: nades });
  } catch (err) { next(err); }
};

export const createNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, map_name, side, category, nade_type, title, description, video_url, pos_x, pos_y } = req.body;
    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required' });
    if (!map_name || !String(map_name).trim() || !title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'map_name and title are required' });
    }
    if (!SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'invalid category' });
    if (!NADE_TYPES.includes(nade_type)) return res.status(400).json({ success: false, message: 'invalid nade_type' });

    const nade = await nadesService.createNade(
      Number(group_id), req.user!.userId, req.user!.role,
      {
        map_name, side, category, nade_type, title, description,
        video_url: video_url ? String(video_url).trim() : undefined,
        pos_x: parsePos(pos_x), pos_y: parsePos(pos_y),
      },
      filesToImages(req),
    );
    res.status(201).json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const updateNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { map_name, side, category, nade_type, title, description, video_url, pos_x, pos_y } = req.body;
    if (side !== undefined && !SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });
    if (category !== undefined && !CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'invalid category' });
    if (nade_type !== undefined && !NADE_TYPES.includes(nade_type)) return res.status(400).json({ success: false, message: 'invalid nade_type' });
    if (title !== undefined && !String(title).trim()) return res.status(400).json({ success: false, message: 'title cannot be empty' });

    const nade = await nadesService.updateNade(Number(req.params.id), req.user!.userId, req.user!.role, {
      map_name, side, category, nade_type, title, description,
      video_url: video_url !== undefined ? (video_url ? String(video_url).trim() : null) : undefined,
      pos_x: pos_x !== undefined ? parsePos(pos_x) ?? null : undefined,
      pos_y: pos_y !== undefined ? parsePos(pos_y) ?? null : undefined,
    });
    res.json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const addNadeImagesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const images = filesToImages(req);
    if (images.length === 0) return res.status(400).json({ success: false, message: 'no images uploaded' });
    const nade = await nadesService.addNadeImages(Number(req.params.id), req.user!.userId, req.user!.role, images);
    res.json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const deleteNadeImageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await nadesService.deleteNadeImage(Number(req.params.imageId), req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const deleteNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await nadesService.deleteNade(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// Фон мини-карты (радар), который загружает тренер для группы
export const getMapBackgroundController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId, mapName } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    if (!mapName) return res.status(400).json({ success: false, message: 'mapName is required' });
    const bg = await nadesService.getMapBackground(Number(groupId), req.user!.userId, req.user!.role, String(mapName));
    res.json({ success: true, data: bg });
  } catch (err) { next(err); }
};

export const setMapBackgroundController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, map_name } = req.body;
    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required' });
    if (!map_name || !String(map_name).trim()) return res.status(400).json({ success: false, message: 'map_name is required' });
    const file = req.file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ success: false, message: 'image is required' });
    const bg = await nadesService.setMapBackground(
      Number(group_id), req.user!.userId, req.user!.role, String(map_name), `/uploads/map-backgrounds/${file.filename}`,
    );
    res.json({ success: true, data: bg });
  } catch (err) { next(err); }
};

export const deleteMapBackgroundController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId, mapName } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    if (!mapName) return res.status(400).json({ success: false, message: 'mapName is required' });
    const result = await nadesService.deleteMapBackground(Number(groupId), req.user!.userId, req.user!.role, String(mapName));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
