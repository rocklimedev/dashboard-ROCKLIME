const { Op } = require("sequelize");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");
const User = require("../models/users");

// Create a new team with members
exports.createTeam = async (req, res) => {
  try {
    const { teamName, adminId, memberIds } = req.body;

    if (!teamName || !adminId) {
      return res.status(400).json({
        success: false,
        message: "Team name and admin ID are required.",
      });
    }

    console.log("Received request body:", req.body);

    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }

    const memberIdArray = Array.isArray(memberIds)
      ? memberIds.filter(Boolean)
      : [];

    const members = memberIdArray.length
      ? await User.findAll({ where: { userId: { [Op.in]: memberIdArray } } })
      : [];

    if (memberIdArray.length && members.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid members found." });
    }

    console.log(
      "Members found:",
      members.map((m) => m.userId)
    );

    const team = await Team.create({
      teamName,
      adminId,
      adminName: admin.username,
    });

    console.log("Team created:", team.id);

    const teamMembers = members.map((member) => ({
      teamId: team.id,
      userId: member.userId,
      userName: member.username,
      roleId: member.roleId,
      roleName: member.roleName || "Member",
    }));

    // Add admin also as team member
    teamMembers.push({
      teamId: team.id,
      userId: admin.userId,
      userName: admin.username,
      roleId: admin.roleId,
      roleName: admin.roleName || "Admin",
    });

    await TeamMember.bulkCreate(teamMembers, { validate: true });

    console.log("Team members added successfully.");

    return res.status(201).json({
      success: true,
      team: {
        id: team.id,
        teamName: team.teamName,
        adminId: team.adminId,
        adminName: team.adminName,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        teammembers: teamMembers,
      },
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
};

// Get all teams with members
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: TeamMember, as: "teammembers" }],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, memberIds } = req.body;

    const team = await Team.findByPk(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    if (teamName) {
      await team.update({ teamName });
    }

    if (memberIds) {
      await TeamMember.destroy({ where: { teamId } });

      const members = await User.findAll({
        where: { userId: { [Op.in]: memberIds } },
      });

      const teamMembers = members.map((member) => ({
        teamId: team.id,
        userId: member.userId,
        userName: member.username,
        roleId: member.roleId,
        roleName: member.roleName || "Member",
      }));

      await TeamMember.bulkCreate(teamMembers);
    }

    res
      .status(200)
      .json({ success: true, message: "Team updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }
    await TeamMember.destroy({ where: { teamId } });
    await team.destroy();
    res
      .status(200)
      .json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a team member
exports.addTeamMember = async (req, res) => {
  try {
    const { teamId, userId, userName, roleId, roleName } = req.body;
    const member = await TeamMember.create({
      teamId,
      userId,
      userName,
      roleId,
      roleName,
    });
    res.status(201).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a team member
exports.removeTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const member = await TeamMember.findByPk(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }
    await member.destroy();
    res
      .status(200)
      .json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get team members by team
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const members = await TeamMember.findAll({ where: { teamId } });
    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findByPk(teamId, {
      include: [{ model: TeamMember, as: "teammembers" }],
    });
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }
    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a team member role
exports.updateTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { roleId, roleName } = req.body;

    const member = await TeamMember.findByPk(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    await member.update({ roleId, roleName });
    res
      .status(200)
      .json({ success: true, message: "Member updated successfully", member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
