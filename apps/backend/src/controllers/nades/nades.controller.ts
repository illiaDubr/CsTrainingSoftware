import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as nadesService from '../../services/nades/nades.service';

const SIDES = ['T', 'CT'];
const CATEGORIES = ['base', 'default', 'extra'];
const NADE_TYPES = ['smoke', 'flash', 'molotov', 'he'];

const filesToPaths = (req: AuthRequest): string[] => {
  const files = (req.files as Express.Multer.File[]) || [];
  return files.map(f => `/uploads/nades/${f.filename}`);
};

export const getNadeMapsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const maps = await nadesService.getNadeMaps(req.user!.userId, req.user!.role);
    res.json({ success: true, data: maps });
  } catch (err) { next(err); }
};

export const getNadesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mapName } = req.query;
    if (!mapName) return res.status(400).json({ success: false, message: 'mapName is required' });
    const nades = await nadesService.getNadesByMap(req.user!.userId, req.user!.role, String(mapName));
    res.json({ success: true, data: nades });
  } catch (err) { next(err); }
};

export const createNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { map_name, side, category, nade_type, title, description } = req.body;
    if (!map_name || !String(map_name).trim() || !title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'map_name and title are required' });
    }
    if (!SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'invalid category' });
    if (!NADE_TYPES.includes(nade_type)) return res.status(400).json({ success: false, message: 'invalid nade_type' });

    const nade = await nadesService.createNade(
      req.user!.userId,
      { map_name, side, category, nade_type, title, description },
      filesToPaths(req),
    );
    res.status(201).json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const updateNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { map_name, side, category, nade_type, title, description } = req.body;
    if (side !== undefined && !SIDES.includes(side)) return res.status(400).json({ success: false, message: 'invalid side' });
    if (category !== undefined && !CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: 'invalid category' });
    if (nade_type !== undefined && !NADE_TYPES.includes(nade_type)) return res.status(400).json({ success: false, message: 'invalid nade_type' });
    if (title !== undefined && !String(title).trim()) return res.status(400).json({ success: false, message: 'title cannot be empty' });

    const nade = await nadesService.updateNade(Number(req.params.id), req.user!.userId, {
      map_name, side, category, nade_type, title, description,
    });
    res.json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const addNadeImagesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paths = filesToPaths(req);
    if (paths.length === 0) return res.status(400).json({ success: false, message: 'no images uploaded' });
    const nade = await nadesService.addNadeImages(Number(req.params.id), req.user!.userId, paths);
    res.json({ success: true, data: nade });
  } catch (err) { next(err); }
};

export const deleteNadeImageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await nadesService.deleteNadeImage(Number(req.params.imageId), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const deleteNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await nadesService.deleteNade(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
