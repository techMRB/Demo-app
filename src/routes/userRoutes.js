import express from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser, verifyEmail, updateUserRole } from '../controller/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, requireFreshSession } from '../middleware/rbacMiddleware.js';
const router = express.Router();

router.post('/register', createUser)
router.get('/verify-email/:token', verifyEmail)

router.get('/get-all-users', protect, requireFreshSession, authorizeRoles('admin', 'user'), getAllUsers)
router.get('/:id', protect, requireFreshSession, authorizeRoles('admin'), getUserById)
router.put('/:id', protect, requireFreshSession, authorizeRoles('admin'), updateUser)
router.delete('/:id', protect, requireFreshSession, authorizeRoles('admin'), deleteUser)
router.put('/:id/role', protect, requireFreshSession, authorizeRoles('admin'), updateUserRole)

export default router;