import express from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from '../controller/userController.js';

const router = express.Router();

router.post('/', createUser)

router.get('/get-all-users', getAllUsers)
router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)


export default router;