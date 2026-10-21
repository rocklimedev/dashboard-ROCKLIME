const express = require('express');
const router = express.Router();
const { auth, invalidateUserCache } = require('../../middleware/auth');
const userController = require('./user.controller');
const { guardModule } = require('../../middleware/permission');
const multer = require('multer');
router.use(auth);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'));
    }
  },
});
// Self-service endpoints need only a login; everything else needs "users"
// permissions (view / write / edit / delete by HTTP method).
router.use(
  guardModule('users', [
    { method: 'GET', path: /^\/me$/, skip: true },
    { method: 'PUT', path: /^\/$/, skip: true },
    { method: 'POST', path: /^\/photo$/, skip: true },
    { method: 'POST', path: /^\/report\//, skip: true },
  ]),
);

// A changed user (status, role) must not keep cached access.
router.use((req, res, next) => {
  if (req.method !== 'GET') res.on('finish', () => invalidateUserCache());
  next();
});

// Logged-in user's own profile
router.get('/me', userController.getProfile);
router.put('/', userController.updateProfile);
router.post('/photo', upload.single('photo'), userController.uploadUserPhoto);
router.post('/report/:userId', userController.reportUser);

// User management (fixed paths before "/:userId")
router.get('/', userController.getAllUsers);
router.post('/add', userController.createUser);
router.get('/search', userController.searchUser);
router.put('/assign-role/:userId', userController.assignRole);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
router.patch('/:userId/status', userController.updateStatus);
router.delete('/:userId', userController.deleteUser);

module.exports = router;
