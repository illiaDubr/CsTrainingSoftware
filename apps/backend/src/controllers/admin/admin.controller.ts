import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as adminService from '../../services/admin/admin.service';
import * as nadesService from '../../services/nades/nades.service';
import * as tacticsService from '../../services/tactics/tactics.service';
import * as materialsService from '../../services/materials/materials.service';
import * as trainingsService from '../../services/trainings/trainings.service';
import * as matchesService from '../../services/matches/matches.service';
import * as groupsService from '../../services/groups/groups.service';

// ───────────────────────── Обзор ─────────────────────────

export const getOverviewController = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ───────────────────────── Пользователи ─────────────────────────

export const listUsersController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, q, status } = req.query;
    const data = await adminService.listUsers({
      role: role ? String(role) : undefined,
      q: q ? String(q) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getUserDetailController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getUserDetail(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateUserController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, full_name, in_game_role, bio, role, is_active, password } = req.body;
    const data = await adminService.adminUpdateUser(Number(req.params.id), {
      username, full_name, in_game_role, bio, role, is_active, password,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ───────────────────────── Группы ─────────────────────────

export const listGroupsController = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listGroups();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listCoachesController = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listCoaches();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getGroupDetailController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getGroupDetail(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateGroupController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, coach_id } = req.body;
    const data = await adminService.adminUpdateGroup(Number(req.params.id), { name, description, coach_id });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteGroupController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.adminDeleteGroup(Number(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const removeMemberController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await groupsService.removeMember(
      Number(req.params.id), req.user!.userId, req.user!.role, Number(req.params.playerId)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const setAssistantController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.adminSetAssistantCoach(
      Number(req.params.id), Number(req.params.playerId), !!req.body.is_assistant_coach
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ───────────────────────── Контент ─────────────────────────

const parseContentFilters = (req: AuthRequest) => ({
  mapName: req.query.map ? String(req.query.map) : undefined,
  groupId: req.query.groupId ? Number(req.query.groupId) : undefined,
  q: req.query.q ? String(req.query.q) : undefined,
});

export const listNadesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listAllNades(parseContentFilters(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteNadeController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await nadesService.deleteNade(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listTacticsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listAllTactics(parseContentFilters(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteTacticController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await tacticsService.deleteTactic(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listMaterialsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listAllMaterials(parseContentFilters(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteMaterialController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await materialsService.deleteMaterial(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listTrainingsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listAllTrainings(parseContentFilters(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteTrainingController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await trainingsService.deleteTraining(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listMatchesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listAllMatches(parseContentFilters(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteMatchController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await matchesService.deleteMatch(Number(req.params.id), req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
