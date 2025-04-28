const express = require("express");
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
} = require("../controller/teamController");
const checkPermission = require("../middleware/permission");

// Teams
router.post(
  "/create",
  // checkPermission("write", "create_team", "teams", "/teams/create"),
  createTeam
);

router.get(
  "/all",
  // checkPermission("view", "get_all_teams", "teams", "/teams/all"),
  getAllTeams
);

router.get(
  "/:teamId",
  // checkPermission("view", "get_team_by_id", "teams", "/teams/:teamId"),
  getTeamById
);

router.put(
  "/update/:teamId",
  // checkPermission("edit", "update_team", "teams", "/teams/update/:teamId"),
  updateTeam
);

router.delete(
  "/delete/:teamId",
  // checkPermission("delete", "delete_team", "teams", "/teams/delete/:teamId"),
  deleteTeam
);

// Members
router.post(
  "/members/add",
  // checkPermission("write", "add_team_members", "teams", "/teams/members/add"),
  addTeamMember
);

router.get(
  "/members/:teamId",
  // checkPermission("view", "get_team_members", "teams", "/teams/members/:teamId"),
  getTeamMembers
);

router.put(
  "/members/update/:memberId",
  // checkPermission("edit", "update_team_member", "teams", "/teams/members/update/:memberId"),
  updateTeamMember
);

router.delete(
  "/members/remove/:memberId",
  // checkPermission("delete", "remove_team_member", "teams", "/teams/members/remove/:memberId"),
  removeTeamMember
);

module.exports = router;
