// mockData.js
export const mockPOs = {
  purchaseOrders: [
    {
      id: "po1",
      poNo: "PO-001",
      status: "CREATED",
      title: "Office Supplies Order",
      createdFor: "cust1",
      priority: "high",
      assignedTo: "team1",
      createdBy: "user1",
      dueDate: "2025-09-05",
      followupDates: ["2025-09-01", "2025-09-03"],
      source: "Manual",
      createdAt: "2025-08-20T10:00:00Z",
    },
    {
      id: "po2",
      poNo: "PO-002",
      status: "APPROVED",
      title: "Equipment Purchase",
      createdFor: "cust2",
      priority: "medium",
      assignedTo: "team2",
      createdBy: "user2",
      dueDate: "2025-08-30",
      followupDates: ["2025-08-28"],
      source: "System",
      createdAt: "2025-08-15T14:30:00Z",
    },
    {
      id: "po3",
      poNo: "PO-003",
      status: "PENDING",
      title: "Software Subscription",
      createdFor: "cust3",
      priority: "low",
      assignedTo: "team1",
      createdBy: "user3",
      dueDate: "2025-09-10",
      followupDates: [],
      source: "Manual",
      createdAt: "2025-08-25T09:00:00Z",
    },
    {
      id: "po4",
      poNo: "PO-004",
      status: "FULFILLED",
      title: "Furniture Order",
      createdFor: "cust1",
      priority: "medium",
      assignedTo: "team3",
      createdBy: "user1",
      dueDate: "2025-08-28",
      followupDates: ["2025-08-27"],
      source: "System",
      createdAt: "2025-08-10T16:00:00Z",
    },
    {
      id: "po5",
      poNo: "PO-005",
      status: "CANCELED",
      title: "Consulting Services",
      createdFor: "cust2",
      priority: "high",
      assignedTo: null,
      createdBy: "user2",
      dueDate: null,
      followupDates: [],
      source: "Manual",
      createdAt: "2025-08-05T11:00:00Z",
    },
  ],
  totalCount: 5,
};

export const mockTeams = {
  teams: [
    { id: "team1", teamName: "Logistics Team" },
    { id: "team2", teamName: "Procurement Team" },
    { id: "team3", teamName: "Operations Team" },
  ],
};

export const mockCustomers = {
  data: [
    { customerId: "cust1", name: "Acme Corp" },
    { customerId: "cust2", name: "Beta Industries" },
    { customerId: "cust3", name: "Gamma Solutions" },
  ],
};

export const mockUsers = {
  users: [
    { userId: "user1", username: "john_doe" },
    { userId: "user2", username: "jane_smith" },
    { userId: "user3", username: "alice_brown" },
  ],
};
