import React from 'react'

const CategoriesItem = () => {
  return (
    <tr>
                        <td>1</td>
                        <td>
                          <h2>
                            <img
                              class="avatar-img rounded me-2"
                              width="30"
                              height="30"
                              src="assets/img/category/category-01.jpg"
                              alt="User Image"
                            />
                          </h2>
                          Advertising
                        </td>
                        <td>19 Dec 2023, 06:12 PM</td>
                        <td>
                          <h2 class="table-avatar">
                            <a
                              href="profile.html"
                              class="avatar avatar-sm me-2"
                            >
                              <img
                                class="avatar-img rounded-circle"
                                src="assets/img/profiles/avatar-21.jpg"
                                alt="User Image"
                              />
                            </a>
                            <a href="profile.html">Admin</a>
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_1"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_1"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            download=""
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            download=""
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr> 
  )
}

export default CategoriesItem