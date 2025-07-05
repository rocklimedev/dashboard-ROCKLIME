import React from "react";
import { Card, Menu, Button, Upload, Avatar as AntAvatar } from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileDoneOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";

const ProfileSidebar = ({
  user,
  avatarUrl,
  activeTab,
  setActiveTab,
  handleAvatarUpload,
  handleForgotPassword,
  isResetting,
}) => {
  return (
    <Card className="sidebar-card">
      <div className="profile-summary">
        <AntAvatar
          size={100}
          src={avatarUrl}
          icon={<UserOutlined />}
          className="profile-avatar"
        />
        <Upload
          name="avatar"
          showUploadList={false}
          customRequest={handleAvatarUpload}
        >
          <Button
            icon={<UploadOutlined />}
            className="avatar-upload-btn"
            type="link"
          >
            Change Avatar
          </Button>
        </Upload>
        <h4 className="profile-name">{user.name}</h4>
        <p className="profile-email">{user.email}</p>
      </div>
      <Menu
        mode="vertical"
        selectedKeys={[activeTab]}
        onClick={(e) => setActiveTab(e.key)}
        className="profile-menu"
      >
        <Menu.Item key="profile" icon={<UserOutlined />}>
          My Profile
        </Menu.Item>
        <Menu.Item key="quotations" icon={<FileTextOutlined />}>
          My Quotations
        </Menu.Item>
        <Menu.Item key="invoices" icon={<FileDoneOutlined />}>
          My Invoices
        </Menu.Item>
        <Menu.Item key="teams" icon={<TeamOutlined />}>
          My Teams
        </Menu.Item>
        <Menu.Item key="orders" icon={<ShoppingCartOutlined />}>
          My Orders
        </Menu.Item>
        <Menu.Item
          key="reset-password"
          icon={<LockOutlined />}
          onClick={handleForgotPassword}
          disabled={isResetting}
        >
          Reset Password
        </Menu.Item>
      </Menu>
    </Card>
  );
};

export default ProfileSidebar;
