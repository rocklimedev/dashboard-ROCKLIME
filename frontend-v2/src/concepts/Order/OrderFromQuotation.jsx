import './OrderFromQuotation.styles.css';
import { Card, Typography } from 'antd';
import { QuotationPickList } from '../../components/Orders/QuotationPicker';

const { Title, Text } = Typography;

/** Orders → From quotation: turn an agreed quotation into an order in one click. */
export default function OrderFromQuotation() {
  return (
    <div className="page-wrapper">
      <div className="content fv2-orderfromquotation-13f5112c65">
        <Title className="fv2-orderfromquotation-57785b8c6b" level={4}>
          Order from a quotation
        </Title>
        <Text type="secondary">
          Pick the quotation; the order form opens with its products, prices, discounts and GST.
        </Text>
        <Card className="fv2-orderfromquotation-25d1b1bd40">
          <QuotationPickList />
        </Card>
      </div>
    </div>
  );
}
