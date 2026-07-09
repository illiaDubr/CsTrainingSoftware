import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as mapsService from '../../services/maps/maps.service';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const getActiveMapsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const maps = await mapsService.getActiveMaps(req.user!.userId, req.user!.role);
    res.json({ success: true, data: maps });
  } catch (err) { next(err); }
};

export const createMapController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { map_name, start_date, end_date } = req.body;

    if (!map_name || !String(map_name).trim()) {
      return res.status(400).json({ success: false, message: 'map_name is required' });
    }
    if (!start_date || !DATE_RE.test(String(start_date)) || !end_date || !DATE_RE.test(String(end_date))) {
      return res.status(400).json({ success: false, message: 'start_date and end_date must be YYYY-MM-DD' });
    }

    const map = await mapsService.createMap(req.user!.userId, {
      map_name: String(map_name).trim(),
      start_date: String(start_date),
      end_date: String(end_date),
    });
    res.status(201).json({ success: true, data: map });
  } catch (err) { next(err); }
};

export const deleteMapController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await mapsService.deleteMap(Number(req.params.id), req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
