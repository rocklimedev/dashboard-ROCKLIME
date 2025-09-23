import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetBrandParentCategoryByIdQuery } from "../../api/brandParentCategoryApi";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import americanStandard from "../../assets/img/products/american_standard.png";
import grohe from "../../assets/img/products/grohe.png";
import colston from "../../assets/img/products/colston-logo_black.png";
import groheBau from "../../assets/img/products/grohe.png";
import jk from "../../assets/img/products/jk_cement.png";
import addons from "../../assets/img/products/addons.png";
import walplast from "../../assets/img/products/walplast.png";
import shivceramics from "../../assets/img/products/shiv_ceremic.png";
import sunheart from "../../assets/img/products/sunheart.jpg";
import subway from "../../assets/img/products/subway.webp";
import ibis from "../../assets/img/products/ibis.avif";
import sgt from "../../assets/img/products/sgt.jpg";
import plumbing from "../../assets/img/products/plumbing.jpg";
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
      AS_001: americanStandard,
      GP_002: grohe,
      colston: colston,
      GB_004: groheBau,
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
          url: `/products/brand/${brand.id}`,
          image: logoMap[brand.brandSlug] || "https://via.placeholder.com/300",
          alt: `${brand.brandName} logo`,
        }))
      : [];

    return mappedBrands;
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
    return (
      <div className="empty-container text-center py-5">
        <Empty description="No brands available for this category." />
      </div>
    );
  }

  return (
    <section className="page-wrapper">
      <div className="content">
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
