import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetBrandParentCategoriesQuery } from "../../api/brandParentCategoryApi";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/products/surfaces.jpg";
import fittings from "../../assets/img/products/cp_fittings.png";
import wellness from "../../assets/img/products/wellness.jpg";
import adhesive from "../../assets/img/products/adhesive.jpg";
import "./productwrapper.css";

const Product = () => {
  const {
    data: bpcList,
    isLoading,
    error,
  } = useGetBrandParentCategoriesQuery();

  const imageBySlug = {
    surface: surfaces,
    adhesive: adhesive,
    wellness: wellness,
    cp_fitting: fittings,
    plumbing: fittings,
  };

  const desiredOrder = [
    "cp_fitting",
    "wellness",
    "adhesive",
    "surface",
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
        url: `/brand-parent-categories/${bpc.id}`, // Points to BrandSelection
      };
    });
  }, [bpcList]);

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
        <div className="banner-container">
          <div className="banner-overlay">
            <h2 className="banner-title">Our Products</h2>
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
                <img
                  src={card.image}
                  alt={card.alt}
                  className="categories-img"
                />
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
