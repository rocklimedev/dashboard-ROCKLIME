import { Button, Checkbox, Dropdown, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";

export default function PdfExportOptions({ fields, hidden, onHiddenChange, onReset }) {
  return <Dropdown trigger={["click"]} placement="bottomRight" dropdownRender={() => (
    <div style={{ background: "white", padding: 16, width: 270, maxHeight: "70vh", overflowY: "auto", borderRadius: 10, boxShadow: "0 8px 24px #0002" }}>
      <Typography.Text strong>Export fields (PDF & Excel)</Typography.Text>
      {fields.map(([key, label]) => <div key={key}>
        <Checkbox checked={!hidden.includes(key)} onChange={e => onHiddenChange(e.target.checked ? hidden.filter(value => value !== key) : [...hidden, key])}>{label}</Checkbox>
      </div>)}
      <Button type="link" block onClick={onReset}>Reset defaults</Button>
    </div>
  )}><Button icon={<SettingOutlined />}>Export fields</Button></Dropdown>;
}
