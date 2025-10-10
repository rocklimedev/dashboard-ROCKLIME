import React from "react";
import { Table, Spin, Alert, Badge, Typography } from "antd";

const { Title } = Typography;

const DataTable = ({
  title,
  columns,
  dataSource,
  isLoading,
  error,
  rowKey,
}) => {
  return (
    <div>
      <Title level={4}>{title}</Title>
      {isLoading ? (
        <Spin />
      ) : error ? (
        <Alert
          message={`Error loading ${title.toLowerCase()}`}
          description={error.message}
          type="error"
        />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource || []}
          rowKey={rowKey}
          pagination={{ pageSize: 5 }}
          className="profile-table"
        />
      )}
    </div>
  );
};

export default DataTable;
