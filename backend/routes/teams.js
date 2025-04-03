const express = require("express");
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  updateTeam,
  deleteTeam,
  addTeamMember,
  getTeamMembers,
  updateTeamMember,
  removeTeamMember,
} = require("../controller/teamController");

router.post("/create", createTeam);
router.get("/all", getAllTeams);
router.put("/:teamId/update", updateTeam);
router.delete("/:teamId/delete", deleteTeam);
router.post("/add", addTeamMember);
router.get("/:teamId/members", getTeamMembers);
router.put("/:memberId/update", updateTeamMember);
router.delete("/:memberId/remove", removeTeamMember);
module.exports = router;
