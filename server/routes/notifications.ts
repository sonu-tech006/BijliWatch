import { Router, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const notifications = localStore.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  res.json({ notifications, unreadCount });
});

// Mark single notification as read
router.patch('/:id/read', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const notif = localStore.notifications.find((n) => n.id === id && n.userId === userId);
  if (notif) {
    notif.read = true;
  }

  res.json({ message: 'Marked as read.' });
});

// Mark all as read
router.patch('/read-all', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  localStore.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.read = true;
    }
  });

  res.json({ message: 'All notifications marked as read.' });
});

export default router;
