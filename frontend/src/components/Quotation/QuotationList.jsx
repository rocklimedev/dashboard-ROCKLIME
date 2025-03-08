import React from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
const QuotationList = () => {
  const { data: quotations, isLoading, isError } = useGetAllQuotationsQuery();

  if (isLoading) return <p>Loading quotations...</p>;
  if (isError) return <p>Error fetching quotations!</p>;
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader />
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span className="checkmarks"></span>
                      </label>
                    </th>
                    <th>Quotation Title</th>
                    <th>Quotation Date</th>
                    <th>Due Date</th>
                    <th>Reference Number</th>
                    <th>Final Amount</th>
                    <th>Total</th>
                    <th className="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotations?.map((quotation) => (
                    <tr>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks"></span>
                        </label>
                      </td>
                      <td>{quotation.quotation_title}</td>
                      <td>{quotation.quotation_date}</td>
                      <td>{quotation.due_date}</td>
                      <td>{quotation.reference_number}</td>
                      <td>{quotation.finl_amount}</td>
                      <td>{quotation.total}</td>
                      <td>
                        <div className="edit-delete-action d-flex align-items-center">
                          <a
                            className="me-2 p-2 mb-0 d-flex align-items-center border p-1 rounded"
                            href="javascript:void(0);"
                          >
                            <i data-feather="eye" className="action-eye"></i>
                          </a>
                          <a
                            className="me-2 p-2 mb-0 d-flex align-items-center border p-1 rounded"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-quotation"
                          >
                            <i data-feather="edit" className="feather-edit"></i>
                          </a>
                          <a
                            className="me-2 p-2 mb-0 d-flex align-items-center border p-1 rounded"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#delete"
                          >
                            <i
                              data-feather="trash-2"
                              className="feather-trash-2"
                            ></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationList;
