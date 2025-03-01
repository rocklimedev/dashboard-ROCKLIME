import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllProductsQuery } from "../../api/productApi";
import DataTablePagination from "../Common/DataTablePagination";
import TableHeader from "../Common/TableHeader";
const ProductList = () => {
  const { data, error, isLoading } = useGetAllProductsQuery();
  const products = Array.isArray(data?.products) ? data.products : [];

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products.</p>;
  if (products.length === 0) return <p>No products available.</p>;

  const offset = currentPage * itemsPerPage;
  const currentItems = products.slice(offset, offset + itemsPerPage);
  return (
    <div class="page-wrapper">
      <div class="content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4 class="fw-bold">Product List</h4>
              <h6>Manage your products</h6>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf">
                <img src="assets/img/icons/pdf.svg" alt="img" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
                <img src="assets/img/icons/excel.svg" alt="img" />
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i class="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i class="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
          <div class="page-btn">
            <a href="add-product.html" class="btn btn-primary">
              <i class="ti ti-circle-plus me-1"></i>Add Product
            </a>
          </div>
          <div class="page-btn import">
            <a
              href="#"
              class="btn btn-secondary color"
              data-bs-toggle="modal"
              data-bs-target="#view-notes"
            >
              <i data-feather="download" class="me-1"></i>Import Product
            </a>
          </div>
        </div>

        <div class="card">
          <TableHeader />
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>

                    <th>Product Name</th>
                    <th>Product Code</th>
                    <th>Product Group</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Created By</th>
                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems?.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>

                      <td>
                        <div class="d-flex align-items-center">
                          <a
                            href="javascript:void(0);"
                            class="avatar avatar-md me-2"
                          >
                            <img
                              src="assets/img/products/stock-img-01.png"
                              alt="product"
                            />
                          </a>
                          <a href="javascript:void(0);"> {product.name} </a>
                        </div>
                      </td>
                      <td>{product.product_code}</td>
                      <td>{product.productGroup}</td>
                      <td>{product.categoryId}</td>
                      <td>{product.brandId}</td>
                      <td>{product.sellingPrice}</td>
                      <td>{product.tax}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <div class="d-flex align-items-center">
                          <a
                            href="javascript:void(0);"
                            class="avatar avatar-sm me-2"
                          >
                            <img
                              src="assets/img/users/user-30.jpg"
                              alt="product"
                            />
                          </a>
                          <a href="javascript:void(0);">James Kirwin</a>
                        </div>
                      </td>
                      <td class="action-table-data">
                        <Actions />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <DataTablePagination
        data={products}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductList;
