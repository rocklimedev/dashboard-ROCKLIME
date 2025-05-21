import React, { useState, useEffect } from "react";
import { MdSearch } from "react-icons/md";
import { BiCommand } from "react-icons/bi";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useSearchAllQuery } from "../../api/searchApi";
const SearchDropdown = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const storedSearches = JSON.parse(
      localStorage.getItem("recentSearches") || "[]"
    );
    setRecentSearches(storedSearches);
  }, []);

  // Save search term to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const updatedSearches = [
      term,
      ...recentSearches.filter((s) => s !== term),
    ].slice(0, 5); // Keep top 5
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  // RTK Query to fetch search results
  const { data, isLoading, isError, error } = useSearchAllQuery(
    { query: searchTerm, page: 1, limit: 5 },
    { skip: !searchTerm } // Skip if searchTerm is empty
  );

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    saveRecentSearch(searchTerm);
    navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  // Handle recent search click
  const handleRecentSearch = (term) => {
    setSearchTerm(term);
    navigate(`/search?query=${encodeURIComponent(term)}`);
  };

  // Render search results
  const renderResults = () => {
    if (isLoading) {
      return <div className="search-info text-center p-2">Loading...</div>;
    }

    if (isError) {
      toast.error(error.message || "Failed to fetch search results");
      return (
        <div className="search-info text-center p-2 text-danger">
          Error loading results
        </div>
      );
    }

    if (!searchTerm) {
      return (
        <div className="search-info">
          <h6>
            <span>
              <i data-feather="search" className="feather-16"></i>
            </span>
            Recent Searches
          </h6>
          {recentSearches.length > 0 ? (
            <ul className="search-tags">
              {recentSearches.map((term, index) => (
                <li key={index}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRecentSearch(term);
                    }}
                  >
                    {term}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent searches</p>
          )}
        </div>
      );
    }

    if (
      !data ||
      Object.keys(data.results).every((key) => !data.results[key].items.length)
    ) {
      return (
        <div className="search-info text-center p-2">No results found</div>
      );
    }

    return Object.entries(data.results)
      .filter(([_, result]) => result.items.length > 0)
      .map(([modelName, result]) => (
        <div key={modelName} className="search-info">
          <h6>
            <span>
              <i
                data-feather={modelName === "Customer" ? "user" : "search"}
                className="feather-16"
              ></i>
            </span>
            {modelName}
          </h6>
          <ul
            className={modelName === "Customer" ? "customers" : "search-tags"}
          >
            {result.items.slice(0, 3).map((item) => (
              <li key={item[`${modelName.toLowerCase()}Id`] || item.id}>
                <Link
                  to={`/${modelName.toLowerCase()}/${
                    item[`${modelName.toLowerCase()}Id`] || item.id
                  }`}
                >
                  {modelName === "Customer" && item.images ? (
                    <>
                      {item.name || item.email}
                      <img
                        src={
                          item.images[0] || "assets/img/profiles/avatar-01.jpg"
                        }
                        alt="Img"
                        className="img-fluid"
                      />
                    </>
                  ) : (
                    item.name ||
                    item.title ||
                    item.document_title ||
                    item.invoiceNo ||
                    item.keyword ||
                    item.teamName ||
                    item.vendorName ||
                    item.roleName ||
                    item.username ||
                    item.street ||
                    item.brandName
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ));
  };

  return (
    <form className="dropdown" onSubmit={handleSearch}>
      <div
        className="searchinputs input-group dropdown-toggle"
        id="dropdownMenuClickable"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
      >
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="search-addon">
          <span>
            <MdSearch />
          </span>
        </div>
        <span className="input-group-text">
          <kbd className="d-flex align-items-center">
            <BiCommand />K
          </kbd>
        </span>
      </div>
      <div
        className="dropdown-menu search-dropdown"
        aria-labelledby="dropdownMenuClickable"
      >
        {renderResults()}
      </div>
    </form>
  );
};

export default SearchDropdown;
