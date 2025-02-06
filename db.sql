Table user {
  userId int [primary key]
  username varchar(50) [unique, not null]
  name varchar(100) [not null]
  email varchar(100) [unique, not null]
  mobileNumber varchar(20) [not null]
  role enum('superadmin', 'admin', 'Accounts', 'users', 'staff') [not null]
  status enum('active', 'inactive', 'restricted') [not null]
}

Table address {
  addressId int [primary key]
 
  street varchar(255)
  city varchar(100)
  state varchar(100)
  postalCode varchar(20)
  country varchar(100)

  // Correct foreign key reference syntax for dbdiagram.io
  userId int [ref: > user.userId]
}

Table category {
  categoryId int [primary key]
  name varchar(100) [not null, unique]
  total_products int [not null, default: 0]
  slug varchar(255) [unique, not null]
  parentCategory boolean [not null]
  parentCategoryName varchar(100)
}

Table products {
  productId int [primary key]
  itemType enum('product', 'service') [not null]
  name varchar(255) [not null]
  sku varchar(100) [unique, not null]
 
  sellingPrice decimal(10,2) [not null]
  purchasingPrice decimal(10,2) [not null]
  quantity int [not null]
  discountType enum('percent', 'fixed')
  barcode varchar(100) [unique]
  alert_quantity int
  tax decimal(5,2)
  description text
  images json

  // Correct foreign key reference syntax for dbdiagram.io
  categoryId int [ref: > category.categoryId]
}

Table roles_permissions {
  roleId int [primary key]
  role_name varchar(100) [not null, unique]

  permissions json [not null]

  // Correct foreign key reference syntax for dbdiagram.io
  userId int  [ref: > user.userId]
}

Table quotation {
  quotationId int [primary key]
  document_title varchar(255) [not null]

  quotation_date date [not null]
  due_date date [not null]
  reference_number varchar(50)
  include_gst boolean [not null]
  gst_value decimal(10,2)
  products json [not null]
  discountType enum('percent', 'fixed')
  roundOff decimal(10,2)
  finalAmount decimal(10,2) [not null]
  signature_name varchar(255)
  signature_image text

  // Correct foreign key reference syntax for dbdiagram.io
  customerId int [ref: > user.userId]
}

Table signature {
  signatureId int [primary key]
 
  signature_name varchar(255) [not null]
  signature_image text [not null]
  mark_as_default boolean [not null]

  // Correct foreign key reference syntax for dbdiagram.io
  userId  int [ref: > user.userId]
}


Table orders {
  orderNama varchar [pk, unique]  // Unique order identifier
  pipeline varchar[]  // Array of companies
  status enum('active', 'inactive', 'cancelled')  // Status of the order
  dueDate date  // Due date of the order
  assigned varchar[]  // Array of userIds assigned to the order
  followupDates date[]  // Array of upcoming follow-up dates
  source varchar  // Source reference (can be null)
  priority enum('high', 'medium', 'low')  // Priority of the order
  description text  // Description of the order
  quotationId varchar [ref: > quotation.quotationId]  // Reference to the related quotation
}
Table invoices {
  invoiceId int [primary key]
  client int [ref: > user.userId]  // Reference to client in the user table
  billTo varchar(255)  // Name of client (can be a custom name or user name)
  shipTo int [ref: > address.addressId]  // Reference to address in the address table
  amount decimal(10, 2) [not null]  // Amount of the invoice
  orderNumber varchar(100)  // Order name or number, linked to orderName in orders table
  invoiceDate date [not null]  // Exact date of the invoice
  dueDate date [not null]  // Deadline date to submit the order
  paymentMethod varchar[]  // Array of payment methods used
  status enum('paid', 'unpaid', 'partially paid') [not null]  // Status of payment
  orderId int [ref: > orders.orderNama]  // Reference to the order in the orders table
  products json [not null]  // Product array from the order (linked to order)
  signatureName varchar(255)  // Signature name, linked to signature in signature table
}