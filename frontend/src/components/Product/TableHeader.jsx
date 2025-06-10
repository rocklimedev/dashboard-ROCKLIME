import { Form, Row, Col, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
const { Option } = Select;
const TableHeader = ({ filters, setFilters, additionalSortOptions = [] }) => {
  return (
    <Form layout="vertical" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item label="Search Products">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by product name or code..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Category">
            <Select
              value={filters.category || undefined}
              onChange={(value) =>
                setFilters({ ...filters, category: value || null })
              }
              allowClear
              placeholder="All Categories"
            >
              {filters.categories?.map((cat) => (
                <Option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Brand">
            <Select
              value={filters.brand || undefined}
              onChange={(value) =>
                setFilters({ ...filters, brand: value || null })
              }
              allowClear
              placeholder="All Brands"
            >
              {filters.brands?.map((brand) => (
                <Option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label="Sort By">
            <Select
              value={filters.sortBy || undefined}
              onChange={(value) =>
                setFilters({ ...filters, sortBy: value || null })
              }
              allowClear
              placeholder="Default"
            >
              <Option value="Ascending">Name: A-Z</Option>
              <Option value="Descending">Name: Z-A</Option>
              <Option value="Recently Added">Recently Added</Option>
              <Option value="Price Low to High">Price: Low to High</Option>
              <Option value="Price High to Low">Price: High to Low</Option>
              {additionalSortOptions.map((option) => (
                <Option key={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
export default TableHeader;
