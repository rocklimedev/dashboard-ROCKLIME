const request = require("supertest");
const app = require("../app"); // Ensure your Express app is correctly exported in app.js
const RolePermission = require("../models/rolePermission");
const Permission = require("../models/permisson");
const { v4: uuidv4 } = require("uuid");
const jest = require("jest");
jest.mock("../models/rolePermission");
jest.mock("../models/permission");

describe("Role Permission Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/roles", () => {
    it("should create a new role", async () => {
      const mockRole = {
        roleId: uuidv4(),
        role_name: "Admin",
        permissions: [],
      };
      RolePermission.create.mockResolvedValue(mockRole);

      const res = await request(app).post("/api/roles").send({
        role_name: "Admin",
        permissions: [],
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockRole);
      expect(RolePermission.create).toHaveBeenCalledWith({
        roleId: expect.any(String),
        role_name: "Admin",
        permissions: [],
      });
    });

    it("should return 500 on error", async () => {
      RolePermission.create.mockRejectedValue(new Error("Error creating role"));

      const res = await request(app).post("/api/roles").send({
        role_name: "Admin",
        permissions: [],
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Error creating role" });
    });
  });

  describe("GET /api/roles", () => {
    it("should return all roles", async () => {
      const mockRoles = [
        { roleId: uuidv4(), role_name: "Admin", permissions: [] },
        { roleId: uuidv4(), role_name: "User", permissions: [] },
      ];
      RolePermission.findAll.mockResolvedValue(mockRoles);

      const res = await request(app).get("/api/roles");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRoles);
    });

    it("should return 500 on error", async () => {
      RolePermission.findAll.mockRejectedValue(
        new Error("Error retrieving roles")
      );

      const res = await request(app).get("/api/roles");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Error retrieving roles" });
    });
  });

  describe("PUT /api/roles/:roleId", () => {
    it("should update a role's permissions", async () => {
      const roleId = uuidv4();
      const mockRole = { roleId, role_name: "Admin", permissions: [] };

      RolePermission.findByPk.mockResolvedValue(mockRole);
      mockRole.save = jest.fn().mockResolvedValue(mockRole);

      const res = await request(app)
        .put(`/api/roles/${roleId}`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRole);
      expect(mockRole.save).toHaveBeenCalled();
    });

    it("should return 404 if role not found", async () => {
      RolePermission.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/roles/${uuidv4()}`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Role not found" });
    });

    it("should return 500 on error", async () => {
      RolePermission.findByPk.mockRejectedValue(
        new Error("Error updating role permissions")
      );

      const res = await request(app)
        .put(`/api/roles/${uuidv4()}`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Error updating role permissions" });
    });
  });

  describe("DELETE /api/roles/:roleId", () => {
    it("should delete a role", async () => {
      const roleId = uuidv4();
      const mockRole = { roleId, destroy: jest.fn().mockResolvedValue() };

      RolePermission.findByPk.mockResolvedValue(mockRole);

      const res = await request(app).delete(`/api/roles/${roleId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Role deleted successfully" });
      expect(mockRole.destroy).toHaveBeenCalled();
    });

    it("should return 404 if role not found", async () => {
      RolePermission.findByPk.mockResolvedValue(null);

      const res = await request(app).delete(`/api/roles/${uuidv4()}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Role not found" });
    });

    it("should return 500 on error", async () => {
      RolePermission.findByPk.mockRejectedValue(
        new Error("Error deleting role")
      );

      const res = await request(app).delete(`/api/roles/${uuidv4()}`);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Error deleting role" });
    });
  });

  describe("POST /api/roles/:roleId/permissions", () => {
    it("should assign permissions to a role", async () => {
      const roleId = uuidv4();
      const mockRole = { roleId, role_name: "Admin", permissions: [] };

      RolePermission.findByPk.mockResolvedValue(mockRole);
      mockRole.save = jest.fn().mockResolvedValue(mockRole);

      const res = await request(app)
        .post(`/api/roles/${roleId}/permissions`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRole);
      expect(mockRole.save).toHaveBeenCalled();
    });

    it("should return 404 if role not found", async () => {
      RolePermission.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/roles/${uuidv4()}/permissions`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Role not found" });
    });

    it("should return 500 on error", async () => {
      RolePermission.findByPk.mockRejectedValue(
        new Error("Error assigning permissions")
      );

      const res = await request(app)
        .post(`/api/roles/${uuidv4()}/permissions`)
        .send({
          permissions: ["perm-1", "perm-2"],
        });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Error assigning permissions to role",
      });
    });
  });
});
