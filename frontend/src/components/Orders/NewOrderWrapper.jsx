import React from "react";

const NewOrderWrapper = () => {
  return (
    <>
      <div>
        <h1>Order</h1>
      </div>
      <button class="create-button">+ Create order</button>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>STATUS</th>
              <th>ITEM</th>
              <th>ORDER NUMBER</th>
              <th>CUSTOMER NAME</th>
              <th>SHIPPING SERVICE</th>
              <th>TRACKING CODE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>59217</td>
              <td>
                <span class="status New">New order</span>
              </td>
              <td>1</td>
              <td>59217342</td>
              <td>Cody Fisher</td>
              <td>
                <span class="shipping-dot Standard"></span>Standard
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
            <tr>
              <td>59213</td>
              <td>
                <span class="status Production">In production</span>
              </td>
              <td>2</td>
              <td>59217343</td>
              <td>Kristin Watson</td>
              <td>
                <span class="shipping-dot Priority"></span>Priority
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
            <tr>
              <td>59219</td>
              <td>
                <span class="status Shipped">Shipped</span>
              </td>
              <td>12</td>
              <td>59217344</td>
              <td>Esther Howard</td>
              <td>
                <span class="shipping-dot Express"></span>Express
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
            <tr>
              <td>59220</td>
              <td>
                <span class="status Cancelled">Cancelled</span>
              </td>
              <td>22</td>
              <td>59217345</td>
              <td>Jenny Wilson</td>
              <td>
                <span class="shipping-dot Express"></span>Express
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
            <tr>
              <td>59223</td>
              <td>
                <span class="status Rejected">Rejected</span>
              </td>
              <td>32</td>
              <td>59217346</td>
              <td>John Smith</td>
              <td>
                <span class="shipping-dot Express"></span>Express
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
            <tr>
              <td>592182</td>
              <td>
                <span class="status Draft">Draft</span>
              </td>
              <td>41</td>
              <td>59217346</td>
              <td>Cameron Williamson</td>
              <td>
                <span class="shipping-dot Express"></span>Express
              </td>
              <td>940010010936113003113</td>
              <td>
                <span class="edit-icon">✏️</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button>&lt;</button>
        <button class="active">1</button>
        <button>2</button>
        <button>3</button>
        <span>...</span>
        <button>8</button>
        <button>9</button>
        <button>10</button>
        <button>&gt;</button>
      </div>

      <div class="footer">Showing 1 to 10 of 97 results</div>
    </>
  );
};

export default NewOrderWrapper;
