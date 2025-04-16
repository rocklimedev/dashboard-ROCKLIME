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
const checkPermission = require("../middleware/permission");
router.post(
  "/create",
  checkPermission("write", "create_team", "teams", "/teams/create"),
  createTeam
);
router.get(
  "/all",
  checkPermission("view", "get_all_teams", "teams", "/teams/all"),
  getAllTeams
);
router.put(
  "/:teamId/update",
  checkPermission("edit", "update_team", "teams", "/teams/:teamId/update"),
  updateTeam
);
router.delete(
  "/:teamId/delete",
  checkPermission("delete", "delete_team", "teams", "/teams/:teamId/delete"),
  deleteTeam
);
router.post(
  "/add",
  checkPermission("write", "add_team_members", "teams", "/teams/add"),
  addTeamMember
);
router.get(
  "/:teamId/members",
  checkPermission(
    "view",
    "get_team_members",
    "teams",
    "/teams/:teamId/members"
  ),
  getTeamMembers
);
router.put(
  "/:memberId/update",
  checkPermission(
    "edit",
    "update_team_member",
    "teams",
    "/teams/:memberId/update"
  ),
  updateTeamMember
);
router.delete(
  "/:memberId/remove",
  checkPermission("delete", "delete_team", "teams", "/teams/:teamId/delete"),
  removeTeamMember
);
module.exports = router;
