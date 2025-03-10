import React, { useState } from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { MdCategory } from "react-icons/md";
import "./categories.css";
const POSCategories = () => {
  const { data, error, isLoading } = useGetAllCategoriesQuery();
  const categories = Array.isArray(data?.categories) ? data.categories : [];

  const [activeTab, setActiveTab] = useState("all");

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p>Error fetching categories.</p>;

  return (
    <ul className="tabs owl-carousel pos-category">
      {/* Static "All" category */}
      <li
        id="all"
        className={activeTab === "all" ? "active" : ""}
        onClick={() => setActiveTab("all")}
      >
        <button className="category-tab">
          <MdCategory />
          <span>All</span>
        </button>
      </li>

      {/* Dynamic categories */}
      {categories.map((category) => (
        <li
          key={category.id}
          id={category.slug || `category-${category.id}`}
          className={activeTab === category.id ? "active" : ""}
          onClick={() => setActiveTab(category.id)}
        >
          <button className="category-tab">
            <MdCategory />
            <span>{category.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default POSCategories;
