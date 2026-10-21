const express = require('express');
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  getTeamMembers,
  updateTeamMember,
  removeTeamMember,
} = require('./team.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('teams'));
// Teams
router.post('/create', createTeam);

router.get('/all', getAllTeams);

router.get('/:teamId', getTeamById);

router.put('/update/:teamId', updateTeam);

router.delete('/delete/:teamId', deleteTeam);

// Members
router.post('/members/add', addTeamMember);

router.get('/members/:teamId', getTeamMembers);

router.put('/members/update/:memberId', updateTeamMember);

router.delete('/members/remove/:memberId', removeTeamMember);

module.exports = router;
