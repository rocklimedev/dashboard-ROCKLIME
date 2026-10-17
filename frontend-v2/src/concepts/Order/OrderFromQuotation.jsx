import { Card, Typography } from "antd";
import { QuotationPickList } from "../../components/Orders/QuotationPicker";

const { Title, Text } = Typography;

/** Orders → From quotation: turn an agreed quotation into an order in one click. */
export default function OrderFromQuotation() {
  return (
    <div className="page-wrapper">
      <div className="content" style={{ maxWidth: 980 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Order from a quotation
        </Title>
        <Text type="secondary">Pick the quotation; the order form opens with its products, prices, discounts and GST.</Text>
        <Card style={{ marginTop: 16, borderRadius: 12 }}>
          <QuotationPickList />
        </Card>
      </div>
    </div>
  );
}
