import React from "react";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
const POSCategories = () => {
  const { data, error, isLoading } = useGetAllCategoriesQuery();
  const categories = Array.isArray(data?.categories) ? data.categories : [];

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p>Error fetching categories.</p>;

  return (
    <div className="tab-wrap">
      <ul className="tabs owl-carousel pos-category5">
        {/* Static "All" category */}
        <li id="all" className="active">
          <h6>
            <a href="#" onClick={(e) => e.preventDefault()}>
              All
            </a>
          </h6>
        </li>

        {/* Dynamic categories */}
        {categories.map((category) => (
          <li key={category.id} id={category.slug || `category-${category.id}`}>
            <a href="#" onClick={(e) => e.preventDefault()}></a>
            <h6>
              <a href="#" onClick={(e) => e.preventDefault()}>
                {category.name}
              </a>
            </h6>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default POSCategories;
