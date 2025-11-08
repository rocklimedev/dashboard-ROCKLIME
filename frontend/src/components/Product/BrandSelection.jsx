import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetBrandParentCategoryByIdQuery } from "../../api/brandParentCategoryApi";
import Breadcrumb from "./Breadcrumb"; // Adjust the path as needed

const mainWrapper =
  "https://static.cmtradingco.com/brands/product_page_title.png";
const americanStandard =
  "https://static.cmtradingco.com/brands/american_standard.png";
const grohe = "https://static.cmtradingco.com/brands/grohe.png";
const colston = "https://static.cmtradingco.com/brands/colston-logo_black.png";
const groheBau = "https://static.cmtradingco.com/brands/grohe.png";
const jk = "https://static.cmtradingco.com/brands/jk_cement.png";
const addons = "https://static.cmtradingco.com/brands/addons.png";
const walplast = "https://static.cmtradingco.com/brands/walplast.png";
const shivceramics = "https://static.cmtradingco.com/brands/shiv_ceremic.png";
const sunheart = "https://static.cmtradingco.com/brands/sunheart.jpg";
const subway = "https://static.cmtradingco.com/brands/subway.webp";
const ibis = "https://static.cmtradingco.com/brands/ibis.avif";
const sgt = "https://static.cmtradingco.com/brands/sgt.jpg";
const plumbing = "https://static.cmtradingco.com/brands/plumbing.jpg";
const jayna = "https://via.placeholder.com/300";

const BrandSelection = () => {
  const { bpcId } = useParams();

  const {
    data: bpc,
    isLoading,
    error,
  } = useGetBrandParentCategoryByIdQuery(bpcId);

  const brands = useMemo(() => {
    const logoMap = {
      GB_004: groheBau,
      AS_001: americanStandard,
      colston: colston,
      GP_002: grohe,

      JA_003: groheBau,
      surface: groheBau,
      sgt: sgt,
      "shiv-ceramic": shivceramics,
      jtc: jk,
      "baleno-grey": groheBau,
      uw: groheBau,
      ibis: ibis,
      subway: subway,
      sunheart: sunheart,
      extras: addons,
      walplast: walplast,
      jk_adhesive: jk,
      plumbing: plumbing,
    };

    const mappedBrands = Array.isArray(bpc?.brands)
      ? bpc.brands.map((brand) => ({
          id: brand.id,
          name: brand.brandName,
          url: `/store/${brand.id}`,
          image: logoMap[brand.brandSlug] || "https://via.placeholder.com/300",
          alt: `${brand.brandName} logo`,
        }))
      : [];

    return mappedBrands;
  }, [bpc]);

  const breadcrumbItems = [
    { label: "Home", url: "/" },
    { label: "Categories", url: "/category-selector" },
    { label: bpc?.name || "Category" },
  ];

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
    return (
      <div className="empty-container text-center py-5">
        <Empty description="No brands available for this category." />
      </div>
    );
  }

  return (
    <section className="page-wrapper">
      <div className="content">
        <Breadcrumb items={breadcrumbItems} />
        <div className="banner-container">
          <div className="banner-overlay">
            <h2 className="banner-title">{bpc?.name || "Brands"}</h2>
            <p className="banner-subtitle">
              Explore brands under {bpc?.name || "this category"}.
            </p>
          </div>
        </div>

        <div className="categories-wrapper">
          {brands.map((brand) => (
            <div key={brand.id} className="brands-selection-card">
              <Link to={brand.url}>
                <div className="brand-logo-container">
                  <img
                    src={brand.image}
                    alt={brand.alt}
                    className="brands-selection-img"
                  />
                </div>
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
