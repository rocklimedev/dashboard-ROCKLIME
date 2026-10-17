import { useEffect } from "react";
import { message, Col, DatePicker, Form, Input, Modal, Row, Segmented, Select } from "antd";
import { PhoneOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateDealMutation, useGetCrmMetaQuery, useUpdateDealMutation } from "../../api/crmApi";
import { parseRupees } from "./crmUtils";

const QUICK = [
  { label: "Today", d: 0 },
  { label: "Tomorrow", d: 1 },
  { label: "+3 days", d: 3 },
  { label: "+1 week", d: 7 },
];

/**
 * New deal in one short form: name + mobile is enough. Optional value, source,
 * type, and the first follow-up. Also used to edit a deal (`deal` given).
 */
export default function DealFormModal({ open, onClose, onSaved, deal, defaults = {} }) {
  const [form] = Form.useForm();
  const { data: meta } = useGetCrmMetaQuery();
  const [createDeal, { isLoading: creating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: saving }] = useUpdateDealMutation();
  const editing = Boolean(deal);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (deal) {
      form.setFieldsValue({
        ...deal,
        amount: deal.amount ?? "",
        expectedClose: deal.expectedClose ? dayjs(deal.expectedClose) : null,
      });
    } else {
      form.setFieldsValue({ stage: "capture", customerType: "Retail", followUpIn: 1, ...defaults });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal]);

  const submit = async () => {
    const v = await form.validateFields();
    const amount = parseRupees(v.amount);
    if (v.amount && amount == null) return message.error("Value: type a number like 4.5 L or 450000");
    const body = {
      ...v,
      amount,
      expectedClose: v.expectedClose ? v.expectedClose.format("YYYY-MM-DD") : null,
    };
    delete body.followUpIn;
    try {
      if (editing) {
        await updateDeal({ id: deal.id, ...body }).unwrap();
        message.success("Deal saved");
        onSaved?.(deal);
      } else {
        if (v.followUpIn != null && v.followUpIn >= 0) {
          body.followUp = dayjs().add(v.followUpIn, "day").format("YYYY-MM-DD");
          body.followUpTitle = v.followUpTitle || "Follow up";
        }
        const res = await createDeal(body).unwrap();
        message.success("Deal added");
        onSaved?.(res.deal);
      }
      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Could not save the deal");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={editing ? "Save" : "Add deal"}
      confirmLoading={creating || saving}
      title={editing ? "Edit deal" : "New deal"}
      width={660}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={submit} className="crm-form">
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="contactName" label="Customer name" rules={[{ required: !editing && !defaults.customerId, message: "Who is the customer?" }]}>
              <Input prefix={<UserOutlined />} placeholder="Mr Mehra" autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Mobile" rules={[{ pattern: /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, message: "10-digit mobile" }]}>
              <Input prefix={<PhoneOutlined />} placeholder="98110 22334" inputMode="tel" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="title" label="Deal name" tooltip="Left empty: customer name · city">
              <Input placeholder="3 BHK flooring, Dwarka" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="amount" label="Value">
              <Input placeholder="4.5 L" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="city" label="City / area">
              <Input placeholder="Dwarka" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="customerType" label="Customer type">
              <Segmented block options={meta?.customerTypes || ["Retail", "Architect", "Interior", "Builder", "Contractor"]} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="source" label="Source">
              <Select allowClear showSearch placeholder="Walk-in" options={(meta?.sources || []).map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="tag" label="Tag">
              <Select allowClear placeholder="Hot / Warm" options={(meta?.tags || []).map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="ownerId" label="Owner" tooltip="Left empty: you">
              <Select allowClear showSearch optionFilterProp="label" placeholder="Me" options={(meta?.owners || []).map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="expectedClose" label="Expected to close">
              <DatePicker style={{ width: "100%" }} format="D MMM YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Not an email address" }]}>
              <Input placeholder="optional" />
            </Form.Item>
          </Col>
          {!editing && (
            <>
              <Col xs={24} sm={15}>
                <Form.Item name="followUpIn" label="First follow-up">
                  <Segmented block options={[...QUICK.map((x) => ({ label: x.label, value: x.d })), { label: "None", value: -1 }]} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={9}>
                <Form.Item name="followUpTitle" label="What to do">
                  <Input placeholder="Call about showroom visit" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="note" label="Requirement / note">
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Italian marble for living room, budget flexible…" />
                </Form.Item>
              </Col>
            </>
          )}
          {editing && (
            <Col xs={24}>
              <Form.Item name="description" label="Requirement">
                <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
              </Form.Item>
            </Col>
          )}
          <Form.Item name="customerId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="stage" hidden>
            <Input />
          </Form.Item>
        </Row>
        <button type="submit" hidden />
      </Form>
    </Modal>
  );
}
