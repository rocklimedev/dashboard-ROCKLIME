const { Order, Product, Customer } = require("../models");
const { VALID_RESOURCE_TYPES } = require("../config/constants");

/**
 * Confirms a generic "resourceType" (Order/Product/Customer) + id
 * actually exists. Used by the comments feature which is polymorphic.
 */
const validateResource = async (resourceId, resourceType) => {
  const validResourceTypes = {
    Order: Order,
    Product: Product,
    Customer: Customer,
  };

  const Model = validResourceTypes[resourceType];
  if (!Model) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  const resource = await Model.findByPk(resourceId);
  if (!resource) {
    return { valid: false, error: `${resourceType} not found` };
  }

  return { valid: true, resource };
};

const validateCommentInput = ({
  resourceId,
  resourceType,
  userId,
  comment,
}) => {
  if (!resourceId || !resourceType || !userId || !comment?.trim()) {
    return {
      valid: false,
      error: "resourceId, resourceType, userId, and comment are required",
    };
  }

  if (!VALID_RESOURCE_TYPES.includes(resourceType)) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  return { valid: true };
};

const validateCommentFetchInput = ({ resourceId, resourceType }) => {
  if (!resourceId || !resourceType) {
    return {
      valid: false,
      error: "resourceId and resourceType are required",
    };
  }

  if (!VALID_RESOURCE_TYPES.includes(resourceType)) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  return { valid: true };
};

/**
 * Gate-pass is mandatory **only** when moving an order to DISPATCHED.
 */
const canDispatch = (order) => {
  return order.gatePassLink !== null && order.gatePassLink.trim() !== "";
};

module.exports = {
  validateResource,
  validateCommentInput,
  validateCommentFetchInput,
  canDispatch,
};
