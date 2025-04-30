import React from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllUsersQuery } from "../../api/userApi";

const Stats2 = () => {
  // Fetch data using RTK Query hooks with default empty arrays
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

  // Loading and error states
  if (
    isCustomersLoading ||
    isCategoriesLoading ||
    isUsersLoading ||
    isProductsLoading
  ) {
    return <div>Loading...</div>;
  }

  if (customersError || categoriesError || usersError || productsError) {
    return (
      <div>
        Error loading data:
        {customersError && (
          <p>
            {" "}
            Customers:{" "}
            {customersError.data?.message || JSON.stringify(customersError)}
          </p>
        )}
        {categoriesError && (
          <p>
            {" "}
            Categories:{" "}
            {categoriesError.data?.message || JSON.stringify(categoriesError)}
          </p>
        )}
        {usersError && (
          <p>
            {" "}
            Users: {usersError.data?.message || JSON.stringify(usersError)}
          </p>
        )}
        {productsError && (
          <p>
            {" "}
            Products:{" "}
            {productsError.data?.message || JSON.stringify(productsError)}
          </p>
        )}
        <button
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

  // Calculate product count per category efficiently
  const productCountByCategory = products.reduce((acc, product) => {
    const categoryId =
      product.categoryId || product.category?._id || product.category;
    if (categoryId) {
      acc[categoryId] = (acc[categoryId] || 0) + 1;
    }
    return acc;
  }, {});

  const categoryProductCounts = categories.map((category) => {
    const categoryId = category.categoryId || category.id || category._id;
    const productCount = productCountByCategory[categoryId] || 0;
    return {
      ...category,
      productCount,
    };
  });

  // Sort categories by product count and get top 3
  const topCategories = [...categoryProductCounts]
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 3);

  // Prepare data for Recharts PieChart
  const chartData = topCategories.map((cat) => ({
    name: cat.name,
    value: cat.productCount || 0,
  }));

  // Colors for the pie chart
  const COLORS = ["#4A90E2", "#F5A623", "#7B68EE"];

  // Filter top customer based on total amount spent
  const topCustomer = customers.reduce(
    (top, customer) => {
      const totalSpent = customer.totalAmount || 0;
      const payable = customer.paidAmount || 0;
      return totalSpent > top.totalSpent
        ? { ...customer, totalSpent, payable }
        : top;
    },
    { totalSpent: 0, payable: 0 }
  );

  // Filter recently registered users (within last 7 days)
  const recentUsers = users.filter((user) => {
    const createdAt = new Date(user.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdAt >= sevenDaysAgo;
  });

  return (
    <div className="row">
      {/* Top Customer */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-orange fs-16 me-2">
                <i className="ti ti-users"></i>
              </span>
              <h5 className="card-title mb-0">Top Customer</h5>
            </div>
            <Link
              to="/customers"
              className="fs-13 fw-medium text-decoration-underline"
            >
              View All
            </Link>
          </div>
          <div className="card-body">
            {topCustomer.name ? (
              <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center">
                  <Link to="#" className="avatar avatar-lg flex-shrink-0">
                    <img
                      src={
                        topCustomer.avatar ||
                        "assets/img/customer/customer11.jpg"
                      }
                      alt="Customer"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-14 fw-bold mb-1">
                      <Link to="#">{topCustomer.name}</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p className="d-inline-flex align-items-center">
                        <i className="ti ti-map-pin me-1"></i>
                        {topCustomer.country || "Unknown"}
                      </p>
                      <p>{topCustomer.orders?.length || 0} Orders</p>
                    </div>
                    <p className="fs-12 text-muted">
                      Payable: ${topCustomer.payable.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <h5>${topCustomer.totalSpent.toLocaleString()}</h5>
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
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-orange fs-16 me-2">
                <i className="ti ti-users"></i>
              </span>
              <h5 className="card-title mb-0">Top Categories</h5>
            </div>
            <div className="dropdown">
              <a
                href="#"
                className="dropdown-toggle btn btn-sm btn-white d-flex align-items-center"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="ti ti-calendar me-1"></i>Weekly
              </a>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#" className="dropdown-item">
                    Today
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    Weekly
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    Monthly
                  </a>
                </li>
              </ul>
            </div>
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
                    className={`category-item category-${
                      ["primary", "orange", "secondary"][index]
                    }`}
                  >
                    <p className="fs-13 mb-1">{category.name}</p>
                    <h2 className="d-flex align-items-center">
                      {category.productCount || 0}
                      <span className="fs-13 fw-normal text-default ms-1">
                        Products
                      </span>
                    </h2>
                  </div>
                ))}
              </div>
            </div>
            <h6 className="mb-2">Category Statistics</h6>
            <div className="border br-8">
              <div className="d-flex align-items-center justify-content-between border-bottom p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <i className="ti ti-square-rounded-filled text-indigo fs-8 me-2"></i>
                  Total Number Of Categories
                </p>
                <h5>{categories.length}</h5>
              </div>
              <div className="d-flex align-items-center justify-content-between p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <i className="ti ti-square-rounded-filled text-orange fs-8 me-2"></i>
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
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-indigo fs-16 me-2">
                <i className="ti ti-user-plus"></i>
              </span>
              <h5 className="card-title mb-0">Recent Users</h5>
            </div>
            <div className="dropdown">
              <a
                href="#"
                className="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="ti ti-calendar me-1"></i>Last 7 Days
              </a>
              <ul className="dropdown-menu p-3">
                <li>
                  <a href="#" className="dropdown-item">
                    Today
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    Last 7 Days
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    Last 30 Days
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="card-body">
            {recentUsers.length > 0 ? (
              recentUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id || user.email}
                  className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3 flex-wrap gap-2"
                >
                  <div className="d-flex align-items-center">
                    <Link to="#" className="avatar avatar-lg flex-shrink-0">
                      <img
                        src={
                          user.avatar || "assets/img/customer/customer11.jpg"
                        }
                        alt="User"
                      />
                    </Link>
                    <div className="ms-2">
                      <h6 className="fs-14 fw-bold mb-1">
                        <Link to="#">{user.name}</Link>
                      </h6>
                      <div className="d-flex align-items-center item-list">
                        <p className="d-inline-flex align-items-center">
                          <i className="ti ti-mail me-1"></i>
                          {user.email}
                        </p>
                      </div>
                      <p className="fs-12 text-muted">
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
