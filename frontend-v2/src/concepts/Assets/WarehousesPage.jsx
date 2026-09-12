import React, { useState } from "react";
import { Table, Button, Typography, Space, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useGetWarehousesQuery } from "../../api/deviceManagementApi";
import WarehouseFormModal from "../../components/Assets/WarehouseFormModal";
import "./deviceManagement.css";

export default function WarehousesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: warehouses = [], isLoading } = useGetWarehousesQuery();

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (value) => <span className="dm-mono">{value}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "default"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              Warehouses
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddOpen(true)}
            >
              Add warehouse
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={warehouses}
            loading={isLoading}
            locale={{
              emptyText: (
                <div className="dm-empty-state">No warehouses yet.</div>
              ),
            }}
          />

          <WarehouseFormModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
