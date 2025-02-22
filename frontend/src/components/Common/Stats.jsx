import React from 'react'

const Stats = () => {
  return (
    <div class="super-admin-list-head">
    <div class="row">
      <div class="col-xl-3 col-md-6 d-flex">
        <div class="card w-100">
          <div class="card-body">
            <div class="grid-info-item total-items">
              <div class="grid-info">
                <span>Total Companies</span>
                <h4>987</h4>
              </div>
              <div class="grid-head-icon">
                <i class="fe fe-life-buoy"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 d-flex">
        <div class="card w-100">
          <div class="card-body">
            <div class="grid-info-item active-items">
              <div class="grid-info">
                <span>Active Companies</span>
                <h4>154</h4>
              </div>
              <div class="grid-head-icon">
                <i class="fe fe-check-square"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 d-flex">
        <div class="card w-100">
          <div class="card-body">
            <div class="grid-info-item inactive-items">
              <div class="grid-info">
                <span>Inactive Company</span>
                <h4>2</h4>
              </div>
              <div class="grid-head-icon">
                <i class="fe fe-x-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 d-flex">
        <div class="card w-100">
          <div class="card-body">
            <div class="grid-info-item location-info">
              <div class="grid-info">
                <span>Company Locations</span>
                <h4>200</h4>
              </div>
              <div class="grid-head-icon">
                <i class="fe fe-map-pin"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default Stats