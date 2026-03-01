import { Router, Request, Response } from 'express';
import {
  login,
  refreshToken,
  createUser,
  getAllUsers,
  updatePassword,
  deactivateUser,
  activateUser,
} from '../services/authService';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '../types/auth';

const router = Router();

// ─── Public routes ──────────────────────────────────────────────

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      success: false,
      error: 'Username and password are required',
    });
    return;
  }

  const result = login(username, password);

  if (!result.success) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

// ─── Authenticated routes ───────────────────────────────────────

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
    },
  });
});

router.post('/refresh', requireAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const result = refreshToken(token);

  if (!result.success) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

router.post('/change-password', requireAuth, (req: Request, res: Response) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters',
    });
    return;
  }

  const result = updatePassword(req.user!.userId, newPassword);

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json({ success: true, message: 'Password updated successfully' });
});

// ─── Firm owner only routes ─────────────────────────────────────

router.get(
  '/users',
  requireAuth,
  requireRole('firm_owner'),
  (_req: Request, res: Response) => {
    const users = getAllUsers();
    res.json({ success: true, users });
  }
);

router.post(
  '/users',
  requireAuth,
  requireRole('firm_owner'),
  (req: Request, res: Response) => {
    const { username, password, role, displayName, email } = req.body;

    if (!username || !password || !role || !displayName) {
      res.status(400).json({
        success: false,
        error: 'username, password, role, and displayName are required',
      });
      return;
    }

    const validRoles: UserRole[] = ['staff', 'firm_owner'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: 'role must be "staff" or "firm_owner"',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
      return;
    }

    const result = createUser(username, password, role, displayName, email || '');

    if (!result.success) {
      res.status(409).json(result);
      return;
    }

    res.status(201).json(result);
  }
);

router.post(
  '/users/:id/deactivate',
  requireAuth,
  requireRole('firm_owner'),
  (req: Request, res: Response) => {
    const id = String(req.params.id);

    if (id === req.user!.userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
      });
      return;
    }

    const result = deactivateUser(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json({ success: true, message: 'User deactivated' });
  }
);

router.post(
  '/users/:id/activate',
  requireAuth,
  requireRole('firm_owner'),
  (req: Request, res: Response) => {
    const id = String(req.params.id);
    const result = activateUser(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json({ success: true, message: 'User activated' });
  }
);

router.post(
  '/users/:id/reset-password',
  requireAuth,
  requireRole('firm_owner'),
  (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
      });
      return;
    }

    const result = updatePassword(id, newPassword);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json({ success: true, message: 'Password reset successfully' });
  }
);

export default router;
