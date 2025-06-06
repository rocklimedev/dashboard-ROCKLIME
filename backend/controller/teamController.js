const { Op } = require("sequelize");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");
const User = require("../models/users");

// Create a new team with members
exports.createTeam = async (req, res) => {
  try {
    const { teamName, adminId, members } = req.body;

    if (!teamName || !adminId) {
      return res.status(400).json({
        success: false,
        message: "Team name and admin ID are required.",
      });
    }

    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }

    const team = await Team.create({
      teamName,
      adminId,
      adminName: admin.username,
    });

    // Save all members including admin
    const teamMembers = members.map((member) => ({
      teamId: team.id,
      userId: member.userId,
      userName: member.userName,
      roleId: member.roleId,
      roleName: member.roleName || "Member",
    }));

    await TeamMember.bulkCreate(teamMembers);

    return res
      .status(201)
      .json({ success: true, message: "Team created", team });
  } catch (error) {
    return res.status(500).json({
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

exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, adminId, adminName, memberIds } = req.body;

    const team = await Team.findByPk(teamId);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    let changesMade = false;

    // Update teamName if provided and different
    if (teamName && teamName.trim() && teamName !== team.teamName) {
      await team.update({ teamName: teamName.trim() });
      changesMade = true;
    }

    // Update adminId and adminName if provided (optional)
    if (adminId && adminId !== team.adminId) {
      const admin = await User.findByPk(adminId);
      if (!admin) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid admin ID" });
      }
      await team.update({
        adminId,
        adminName: adminName || admin.username,
      });
      changesMade = true;
    }

    // Update members if provided
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      // Validate memberIds
      const members = await User.findAll({
        where: { userId: { [Op.in]: memberIds } },
      });

      if (members.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No valid members found" });
      }

      // Delete existing members
      const deletedCount = await TeamMember.destroy({ where: { teamId } });

      // Create new members
      const teamMembers = members.map((member) => ({
        teamId: team.id,
        userId: member.userId,
        userName: member.username,
        roleId: member.roleId,
        roleName: member.roleName || "Member",
      }));

      await TeamMember.bulkCreate(teamMembers, { validate: true });

      changesMade = true;
    }

    if (!changesMade) {
      return res.status(200).json({
        success: true,
        message: "No changes made to the team",
      });
    }

    // Fetch updated team for response
    const updatedTeam = await Team.findByPk(teamId, {
      include: [{ model: TeamMember, as: "teammembers" }],
    });

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
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
