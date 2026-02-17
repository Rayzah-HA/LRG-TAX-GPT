import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { listClients, getClientContext } from '../services/clientIntelligence';

const router = Router();

// List all remembered clients for the current user
router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.user?.userId || 'anonymous';
  const clients = listClients(userId);

  res.json({
    success: true,
    clients: clients.map((c) => ({
      clientName: c.clientName,
      filingStatus: c.filingStatus,
      state: c.state,
      businessType: c.businessType,
      interactions: c.interactions,
      lastInteraction: c.lastInteraction,
    })),
  });
});

// Get details for a specific client
router.get('/:name', requireAuth, (req: Request, res: Response) => {
  const userId = req.user?.userId || 'anonymous';
  const clientName = decodeURIComponent(String(req.params.name));
  const context = getClientContext(userId, clientName);

  if (!context) {
    res.status(404).json({ success: false, error: 'Client not found' });
    return;
  }

  res.json({
    success: true,
    client: context,
  });
});

export default router;
