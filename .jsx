<div className="row mb-4 align-items-center g-3">
  {/* Search – left side, takes what it needs */}
  <div className="col-12 col-md-7 col-lg-6 col-xl-5">
    <Input
      prefix={<SearchOutlined />}
      placeholder="Search order no, customer, quotation..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      allowClear
      size="large"
      style={{ width: "100%" }}
    />
  </div>

  {/* Filters – right side, takes remaining space */}
  <div className="col-12 col-md-5 col-lg-6 col-xl-7">
    <div className="d-flex gap-3 flex-wrap justify-content-md-end">
      {/* All Selects + Clear button here – same as above */}
      <Select
        value={committedFilters.status}
        style={{ width: 170 }}
        size="large"
      >
        {" "}
        {[
          "PREPARING",
          "CHECKING",
          "INVOICE",
          "DISPATCHED",
          "DELIVERED",
          "PARTIALLY_DELIVERED",
          "CANCELED",
          "DRAFT",
          "ONHOLD",
          "CLOSED",
        ].map((s) => (
          <Option key={s} value={s}>
            {s}
          </Option>
        ))}
      </Select>
      <Select
        value={committedFilters.priority}
        style={{ width: 130 }}
        size="large"
      >
        {" "}
        <Option value="high">High</Option>
        <Option value="medium">Medium</Option>
        <Option value="low">Low</Option>
      </Select>
      <Select value={sortBy} style={{ width: 190 }} size="large">
        {" "}
        <Option value="Recently Added">Recently Added</Option>
        <Option value="Due Date Ascending">Due Date (Soonest)</Option>
        <Option value="Due Date Descending">Due Date (Latest)</Option>
      </Select>
      <Button size="large">Clear</Button>
    </div>
  </div>
</div>;
