// Shows what a customer already owes, and warns when this order would take
// them over their credit limit or when part of what they owe is overdue.
// It is a warning, not a block: the person placing the order decides.
import React from 'react';
import { Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useGetCustomerCreditQuery } from '../../api/customerApi';

const inr = (v) => `₹${Math.round(Number(v) || 0).toLocaleString('en-IN')}`;

export default function CreditAlert({ customerId, amount = 0, style }) {
  const { data } = useGetCustomerCreditQuery(
    { id: customerId, amount: Math.round(Number(amount) || 0) },
    { skip: !customerId },
  );
  if (!customerId || !data || (!data.due && !data.creditLimit)) return null;

  const link = <Link to={`/customer/${customerId}`}>View account</Link>;
  if (data.overLimit) {
    return (
      <Alert
        type="error"
        showIcon
        style={style}
        message={`Over credit limit: ${data.name} owes ${inr(data.due)}; with this order it becomes ${inr(data.afterOrder)} against a limit of ${inr(data.creditLimit)}.`}
        description={<>Collect a payment or get approval before going ahead. {link}</>}
      />
    );
  }
  if (data.overdue > 0) {
    return (
      <Alert
        type="warning"
        showIcon
        style={style}
        message={`${data.name} has ${inr(data.overdue)} overdue (older than ${data.creditDays} days) out of ${inr(data.due)} owed.`}
        description={link}
      />
    );
  }
  if (data.due > 0) {
    return (
      <Alert
        type="info"
        showIcon
        style={style}
        message={`${data.name} owes ${inr(data.due)}${data.creditLimit ? ` (limit ${inr(data.creditLimit)})` : ''}.`}
      />
    );
  }
  return null;
}
