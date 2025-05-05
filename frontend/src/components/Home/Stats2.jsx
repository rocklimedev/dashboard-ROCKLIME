import React from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  FaUsers,
  FaList,
  FaUserPlus,
  FaTriangleExclamation,
} from "react-icons/fa6";

const Stats2 = () => {
  // Fetch data using RTK Query hooks
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useGetCustomersQuery();
  const customers = customersData?.data || [];

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGetAllCategoriesQuery();
  const categories = categoriesData?.categories || [];

  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAllUsersQuery();
  const users = usersData?.users || [];

  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGetAllProductsQuery();
  const products = productsData?.data || [];

  // Date filters (last 7 days, fallback to 30 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter by time
  const filterByTime = (items, dateField) => {
    const weekItems = items.filter(
      (item) => new Date(item[dateField]) >= oneWeekAgo
    );
    return weekItems.length > 0
      ? weekItems
      : items.filter((item) => new Date(item[dateField]) >= oneMonthAgo);
  };

  const filteredProducts = filterByTime(products, "updatedAt"); // Adjust dateField if needed
  const filteredCustomers = filterByTime(customers, "createdAt"); // Adjust if needed
  const filteredCategories = filterByTime(categories, "createdAt"); // Adjust if needed
  const filteredUsers = filterByTime(users, "createdAt");

  // Low Stock Products
  const lowStockProducts = filteredProducts.filter(
    (p) => p.quantity < p.alertQuantity
  );

  // Calculate product count per category
  const productCountByCategory = filteredProducts.reduce((acc, product) => {
    const categoryId =
      product.categoryId || product.category?._id || product.category;
    if (categoryId) {
      acc[categoryId] = (acc[categoryId] || 0) + 1;
    }
    return acc;
  }, {});

  const categoryProductCounts = filteredCategories.map((category) => {
    const categoryId = category.categoryId || category.id || category._id;
    const productCount = productCountByCategory[categoryId] || 0;
    return {
      ...category,
      productCount,
    };
  });

  // Top 3 categories
  const topCategories = [...categoryProductCounts]
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 3);

  // Pie chart data
  const chartData = topCategories.map((cat) => ({
    name: cat.name,
    value: cat.productCount || 0,
  }));

  const COLORS = ["#4A90E2", "#F5A623", "#7B68EE"];

  // Top customer
  const topCustomer = filteredCustomers.reduce(
    (top, customer) => {
      const totalSpent = customer.paidAmount || 0;
      return totalSpent > top.totalSpent
        ? { ...customer, totalSpent, payable: customer.balance || 0 }
        : top;
    },
    { totalSpent: 0, payable: 0 }
  );

  // Loading state
  if (
    isCustomersLoading ||
    isCategoriesLoading ||
    isUsersLoading ||
    isProductsLoading
  ) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (customersError || categoriesError || usersError || productsError) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5>Error loading data:</h5>
        {customersError && (
          <p>
            Customers:{" "}
            {customersError.data?.message || JSON.stringify(customersError)}
          </p>
        )}
        {categoriesError && (
          <p>
            Categories:{" "}
            {categoriesError.data?.message || JSON.stringify(categoriesError)}
          </p>
        )}
        {usersError && (
          <p>Users: {usersError.data?.message || JSON.stringify(usersError)}</p>
        )}
        {productsError && (
          <p>
            Products:{" "}
            {productsError.data?.message || JSON.stringify(productsError)}
          </p>
        )}
        <button
          className="btn btn-primary mt-2"
          onClick={() => {
            if (customersError) refetchCustomers();
            if (categoriesError) refetchCategories();
            if (usersError) refetchUsers();
            if (productsError) refetchProducts();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="row">
      {/* Top Customer */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaUsers className="me-2 text-orange" /> Top Customer
            </h5>
            <Link
              to="/customers"
              className="fs-13 text-decoration-underline text-primary"
            >
              View All
            </Link>
          </div>
          <div className="card-body">
            {topCustomer.name ? (
              <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                <div className="d-flex align-items-center">
                  <Link
                    to={`/customers/${topCustomer.customerId}`}
                    className="avatar avatar-lg flex-shrink-0 me-2"
                  >
                    <img
                      src={
                        topCustomer.avatar ||
                        "/assets/img/customer/customer11.jpg"
                      }
                      alt="Customer"
                      className="rounded"
                      style={{ width: "60px", height: "60px" }}
                    />
                  </Link>
                  <div>
                    <h6 className="fs-14 fw-bold mb-1">
                      <Link
                        to={`/customers/${topCustomer.customerId}`}
                        className="text-dark"
                      >
                        {topCustomer.name}
                      </Link>
                    </h6>
                    <p className="fs-13 mb-1">
                      <i className="ti ti-building me-1"></i>
                      {topCustomer.company || "Unknown"}
                    </p>
                    <p className="fs-13 mb-0">
                      <i className="ti ti-mail me-1"></i>
                      {topCustomer.email}
                    </p>
                    <p className="fs-12 text-muted mb-0">
                      Payable: Rs {topCustomer.payable.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <h5 className="text-primary">
                    Rs {topCustomer.totalSpent.toLocaleString()}
                  </h5>
                </div>
              </div>
            ) : (
              <p>No customers found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaList className="me-2 text-indigo" /> Top Categories
            </h5>
            <Link
              to="/categories"
              className="fs-13 text-decoration-underline text-primary"
            >
              View All
            </Link>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4">
              <div style={{ width: "200px", height: "230px" }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} Products`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No categories found.</p>
                )}
              </div>
              <div>
                {topCategories.map((category, index) => (
                  <div
                    key={category.categoryId || category.id || index}
                    className={`mb-2 category-${
                      ["primary", "orange", "indigo"][index]
                    }`}
                  >
                    <p className="fs-13 mb-1">{category.name}</p>
                    <h4 className="d-flex align-items-center mb-0">
                      {category.productCount || 0}
                      <span className="fs-13 fw-normal text-muted ms-1">
                        Products
                      </span>
                    </h4>
                  </div>
                ))}
              </div>
            </div>
            <h6 className="mb-2">Category Statistics</h6>
            <div className="border rounded p-2">
              <div className="d-flex align-items-center justify-content-between border-bottom p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <i className="ti ti-list text-indigo fs-8 me-2"></i>
                  Total Number Of Categories
                </p>
                <h5>{filteredCategories.length}</h5>
              </div>
              <div className="d-flex align-items-center justify-content-between p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <i className="ti ti-package text-orange fs-8 me-2"></i>
                  Total Number Of Products
                </p>
                <h5>
                  {categoryProductCounts.reduce(
                    (sum, cat) => sum + (cat.productCount || 0),
                    0
                  )}
                </h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="col-xxl-4 col-md-12 d-flex">
        <div className="card flex-fill shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <FaUserPlus className="me-2 text-purple" /> Recent Users
            </h5>
            <Link
              to="/users"
              className="fs-13 text-decoration-underline text-primary"
            >
              View All
            </Link>
          </div>
          <div className="card-body">
            {filteredUsers.length > 0 ? (
              filteredUsers.slice(0, 3).map((user) => (
                <div
                  key={user.userId || user.email}
                  className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3"
                >
                  <div className="d-flex align-items-center">
                    <Link
                      to={`/users/${user.userId}`}
                      className="avatar avatar-lg flex-shrink-0 me-2"
                    >
                      <img
                        src={
                          user.avatar || "/assets/img/customer/customer11.jpg"
                        }
                        alt="User"
                        className="rounded"
                        style={{ width: "60px", height: "60px" }}
                      />
                    </Link>
                    <div>
                      <h6 className="fs-14 fw-bold mb-1">
                        <Link
                          to={`/users/${user.userId}`}
                          className="text-dark"
                        >
                          {user.name}
                        </Link>
                      </h6>
                      <p className="fs-13 mb-1">
                        <i className="ti ti-mail me-1"></i>
                        {user.email}
                      </p>
                      <p className="fs-12 text-muted mb-0">
                        Roles: {user.roles?.join(", ") || "None"}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="fs-12 text-muted">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>No recent users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats2;
