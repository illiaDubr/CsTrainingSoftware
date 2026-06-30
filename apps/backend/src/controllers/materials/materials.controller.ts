import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as materialsService from '../../services/materials/materials.service';

export const getMaterialsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ success: false, message: 'groupId is required' });
    const materials = await materialsService.getMaterials(Number(groupId));
    res.json({ success: true, data: materials });
  } catch (err) { next(err); }
};

export const createMaterialController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { group_id, title, description, external_url, type } = req.body;
    if (!group_id || !title || !type) {
      return res.status(400).json({ success: false, message: 'group_id, title and type are required' });
    }
    const material = await materialsService.createMaterial(req.user!.userId, { group_id, title, description, external_url, type });
    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
};

export const updateMaterialController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, external_url, type } = req.body;
    const material = await materialsService.updateMaterial(Number(req.params.id), req.user!.userId, { title, description, external_url, type });
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
};

export const deleteMaterialController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await materialsService.deleteMaterial(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};