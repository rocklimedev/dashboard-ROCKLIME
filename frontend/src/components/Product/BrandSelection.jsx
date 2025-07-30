import React, { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetBrandParentCategoryByIdQuery } from "../../api/brandParentCategoryApi";
import mainWrapper from "../../assets/img/products/product_page_title.png";

const BrandSelection = () => {
  const { bpcId } = useParams();

  const {
    data: bpc,
    isLoading,
    error,
  } = useGetBrandParentCategoryByIdQuery(bpcId);

  const brands = useMemo(() => {
    return Array.isArray(bpc?.brands)
      ? bpc.brands.map((brand) => ({
          id: brand.id,
          name: brand.brandName,
          url: `/products/brand/${brand.id}`,
          image: "https://via.placeholder.com/300", // Replace with actual brand image
          alt: `${brand.brandName} logo`,
        }))
      : [];
  }, [bpc]);

  if (isLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spin size="large" />
        <p>Loading brands...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container text-center py-5">
        <Empty
          description={`Error: ${error?.data?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  if (!brands.length) {
    return <Navigate to={`/products/bpc/${bpcId}`} replace />;
  }

  return (
    <section className="page-wrapper">
      <div className="content">
        <div className="banner-container">
          <img
            src={mainWrapper}
            alt={`${bpc?.name} banner`}
            className="banner-image"
          />
          <div className="banner-overlay">
            <h2 className="banner-title">{bpc?.name || "Brands"}</h2>
            <p className="banner-subtitle">
              Explore brands under {bpc?.name || "this category"}.
            </p>
          </div>
        </div>

        <div className="categories-wrapper">
          {brands.map((brand) => (
            <div key={brand.id} className="categories-card">
              <Link to={brand.url}>
                <img
                  src={brand.image}
                  alt={brand.alt}
                  className="categories-img"
                />
                <h2 className="categories-text">{brand.name}</h2>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandSelection;
