import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
import Breadcrumb from "./Breadcrumb"; // Adjust the path as needed
import "./productwrapper.css";

const surfaces = "https://static.cmtradingco.com/brands/SIURFACE.png";
const tiles = "https://static.cmtradingco.com/brands/tiles.png";
const plumbing = "https://static.cmtradingco.com/brands/plumbing.jpg";
const fittings = "https://static.cmtradingco.com/brands/CP FITTING.png";
const accessories = "https://static.cmtradingco.com/brands/ACCESORIES.png";
const adhesive = "https://static.cmtradingco.com/brands/ADHESIVE.png";

const Product = () => {
  const {
    data: bpcList,
    isLoading,
    error,
  } = useGetBrandParentCategoriesQuery();

  const imageBySlug = {
    plumbing: plumbing,
    chemicals_and_adhesive: adhesive,
    accessories_and_add_ons: accessories,
    stone_and_granites: surfaces,
    tiles: tiles,
    cp_fittings_and_sanitary: fittings,
  };

  const desiredOrder = [
    "cp_fittings_and_sanitary",
    "tiles",
    "stone_and_granites",
    "chemicals_and_adhesive",
    "accessories_and_add_ons",
    "plumbing",
  ];

  const cards = useMemo(() => {
    const list = Array.isArray(bpcList) ? bpcList : [];
    const sorted = [...list].sort((a, b) => {
      const ai = desiredOrder.indexOf((a.slug || "").toLowerCase());
      const bi = desiredOrder.indexOf((b.slug || "").toLowerCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return sorted.map((bpc) => {
      const slug = (bpc.slug || "").toLowerCase();
      const image = imageBySlug[slug] || surfaces;
      return {
        id: bpc.id,
        name: bpc.name,
        slug: bpc.slug,
        image,
        alt: `${bpc.name} products`,
        url: `/category-selector/${bpc.id}`,
      };
    });
  }, [bpcList]);

  const breadcrumbItems = [
    { label: "Home", url: "/" },
    { label: "Categories" },
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading product groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Empty
          description={`Error: ${error?.data?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="empty-container">
        <Empty description="No product groups available." />
      </div>
    );
  }

  return (
    <section className="page-wrapper">
      <div className="content">
        <Breadcrumb items={breadcrumbItems} />
        <div className="banner-container">
          <div className="banner-overlay">
            <h2 className="banner-title">Our Categories</h2>
            <p className="banner-subtitle">
              Explore our wide range of tiles, sanitary ware, adhesives, and
              more.
            </p>
          </div>
        </div>

        <div className="categories-wrapper">
          {cards.map((card) => (
            <div key={card.id} className="categories-card">
              <Link to={card.url}>
                <div className="brand-logo-container">
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="categories-img"
                  />
                </div>
                <h2 className="categories-text">{card.name}</h2>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Product;
