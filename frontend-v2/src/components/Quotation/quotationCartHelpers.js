export function reconcileQuotationItems(serverItems, localItems = []) {
  return serverItems.map((server) => {
    const local = localItems.find(
      (item) => (item.id && item.id === server.id) || item.productId === server.productId,
    );
    return {
      ...server,
      ...local,
      id: local?.id || server.id || server.productId,
      productId: server.productId,
      price: server.price,
      quantity: server.quantity,
      total: server.total,
      locations: local?.locations ?? server.locations ?? [],
      priority: local?.priority ?? server.priority ?? 0,
    };
  });
}
