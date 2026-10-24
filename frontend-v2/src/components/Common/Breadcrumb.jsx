import './Breadcrumb.styles.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb as AntBreadcrumb } from 'antd';

const Breadcrumb = ({ items }) => {
  return (
    <AntBreadcrumb className="fv2-breadcrumb-5d45156cd2">
      {items.map((item, index) => (
        <AntBreadcrumb.Item key={index}>
          {item.url ? <Link to={item.url}>{item.label}</Link> : <span>{item.label}</span>}
        </AntBreadcrumb.Item>
      ))}
    </AntBreadcrumb>
  );
};

export default Breadcrumb;
