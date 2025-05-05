import React, { useState, useMemo } from "react";
import {
  Card,
  Form,
  Button,
  Spinner,
  Row,
  Col,
  Badge,
  Carousel,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { MdCategory } from "react-icons/md";
import { BsFilter, BsSearch, BsList, BsGrid } from "react-icons/bs";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";

const Categories = () => {
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

  // Group categories into slides (e.g., 4 per slide on lg, 2 on md, 1 on sm)
  const categoriesPerSlide = {
    lg: 4,
    md: 2,
    sm: 1,
  };
  const slides = [];
  for (let i = 0; i < visibleCategories.length; i += categoriesPerSlide.lg) {
    slides.push(visibleCategories.slice(i, i + categoriesPerSlide.lg));
  }

  if (isLoading || isParentLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-danger">
        Error fetching categories: {error?.data?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="categories-container py-4">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Card.Title className="d-flex align-items-center mb-3">
            <MdCategory className="me-2 text-primary" size={24} />
            Category Filters
          </Card.Title>
          <Row className="g-3 align-items-center flex-wrap">
            <Col md={4} sm={6}>
              <Form.Group controlId="parent-select">
                <Form.Label className="d-flex align-items-center">
                  <BsFilter className="me-2 text-muted" />
                  Parent Category
                </Form.Label>
                <Form.Select
                  value={selectedParent}
                  onChange={(e) => {
                    setSelectedParent(e.target.value);
                    setShowAll(false);
                  }}
                >
                  <option value="all">All</option>
                  {parentCategories.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4} sm={6}>
              <Form.Group controlId="search-categories">
                <Form.Label className="d-flex align-items-center">
                  <BsSearch className="me-2 text-muted" />
                  Search Categories
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowAll(false);
                  }}
                />
              </Form.Group>
            </Col>

            <Col md={4} sm={6} className="d-flex align-items-end">
              {filteredCategories.length > 10 && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      {showAll
                        ? "Show fewer categories"
                        : "Show all categories"}
                    </Tooltip>
                  }
                >
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-100"
                  >
                    {showAll ? (
                      <>
                        <BsList className="me-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <BsGrid className="me-2" />
                        Show More
                      </>
                    )}
                  </Button>
                </OverlayTrigger>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Category Slider */}
      {filteredCategories.length > 0 ? (
        <Carousel
          indicators={true}
          controls={true}
          interval={null}
          className="mb-4"
          prevIcon={<span className="carousel-control-prev-icon bg-primary" />}
          nextIcon={<span className="carousel-control-next-icon bg-primary" />}
        >
          {slides.map((slideCategories, index) => (
            <Carousel.Item key={index}>
              <Row className="g-3">
                {slideCategories.map((cat) => (
                  <Col
                    key={cat.categoryId}
                    xs={12}
                    sm={6}
                    md={6}
                    lg={3}
                    className="d-flex"
                  >
                    <Card
                      className="shadow-sm border-0 flex-fill"
                      style={{ transition: "transform 0.2s" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <Card.Body className="d-flex align-items-center">
                        <MdCategory className="me-2 text-primary" />
                        <Card.Title as="h6" className="mb-0">
                          {cat.name}
                        </Card.Title>
                        {cat.parentCategoryId && (
                          <Badge bg="secondary" className="ms-auto">
                            {
                              parentCategories.find(
                                (parent) => parent.id === cat.parentCategoryId
                              )?.name
                            }
                          </Badge>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <div className="text-center py-4 text-muted">
          No categories found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default Categories;
