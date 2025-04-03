const Team = require("../models/team");
const TeamMember = require("../models/teamMember");
const User = require("../models/users");

// Create a new team with members
exports.createTeam = async (req, res) => {
  try {
    const { teamName, adminId, memberIds } = req.body;

    // Fetch admin details from User model
    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // Create the team
    const team = await Team.create({
      name: teamName,
      adminId,
      adminName: admin.username,
    });

    // Fetch member details from User model
    const members = await User.findAll({ where: { userId: memberIds } });

    // Add members (including the admin)
    const teamMembers = members.map((member) => ({
      teamId: team.id,
      userId: member.userId,
      userName: member.username,
      roleId: member.roleId,
      roleName: member.roleName || "Member",
    }));

    // Ensure admin is also added as a member
    teamMembers.push({
      teamId: team.id,
      userId: admin.userId,
      userName: admin.username,
      roleId: admin.roleId,
      roleName: admin.roleName || "Admin",
    });

    await TeamMember.bulkCreate(teamMembers);

    res.status(201).json({ success: true, team, members: teamMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all teams with members
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: TeamMember, as: "teamMembers" }],
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

    await team.update({ name: teamName });

    if (memberIds) {
      await TeamMember.destroy({ where: { teamId } });
      const members = await User.findAll({ where: { userId: memberIds } });
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

// Delete a team (removes members too)
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

// Get members of a team
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const members = await TeamMember.findAll({ where: { teamId } });
    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a team member's role
exports.updateTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { roleId, roleName } = req.body;

    const member = await TeamMember.findByPk(memberId);
    if (!member)
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });

    await member.update({ roleId, roleName });
    res
      .status(200)
      .json({ success: true, message: "Member updated successfully", member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a team member
