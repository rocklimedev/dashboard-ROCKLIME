import React, { useState, useMemo } from "react";
import { MdCategory } from "react-icons/md";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import "./categories.css";

const POSCategories = () => {
  const { data: categoryData, error, isLoading } = useGetAllCategoriesQuery();
  const { data: parentData, isLoading: isParentLoading } =
    useGetAllParentCategoriesQuery();

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const parentCategories = Array.isArray(parentData?.parentCategories)
    ? parentData.parentCategories
    : [];

  const [selectedParent, setSelectedParent] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredCategories = useMemo(() => {
    let result = categories;

    if (selectedParent !== "all") {
      result = result.filter(
        (cat) => cat.parentCategoryId === Number(selectedParent)
      );
    }

    if (searchTerm.trim()) {
      result = result.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [categories, selectedParent, searchTerm]);

  const visibleCategories = showAll
    ? filteredCategories
    : filteredCategories.slice(0, 10);

  if (isLoading || isParentLoading) return <p>Loading categories...</p>;
  if (error) return <p>Error fetching categories.</p>;

  return (
    <>
      {/* Filters Section */}
      <div className="mb-3 d-flex gap-3 align-items-center flex-wrap">
        <label htmlFor="parent-select">Parent Category:</label>
        <select
          id="parent-select"
          className="form-select w-auto"
          value={selectedParent}
          onChange={(e) => {
            setSelectedParent(e.target.value);
            setSelectedCategory("all");
            setShowAll(false);
          }}
        >
          <option value="all">All</option>
          {parentCategories.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-control w-auto"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowAll(false);
          }}
        />

        <label htmlFor="category-select">Category:</label>
        <select
          id="category-select"
          className="form-select w-auto"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All</option>
          {visibleCategories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Show More / Show Less Option */}
        {filteredCategories.length > 10 && (
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "Show More..."}
          </button>
        )}
      </div>

      {/* Optional: You can render the selected category below */}
      {selectedCategory !== "all" && (
        <div className="mt-2">
          <strong>Selected Category:</strong>{" "}
          {
            categories.find(
              (cat) => String(cat.categoryId) === selectedCategory
            )?.name
          }
        </div>
      )}
    </>
  );
};

export default POSCategories;
