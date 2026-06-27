export function getOrderLineImage(line) {
  return line?.variant_image || line?.product_image || line?.image || null;
}

export function collectOrderProductLines(order) {
  const lines = [];
  for (const item of order?.items || []) {
    lines.push({
      key: `item-${item.id}`,
      image: getOrderLineImage(item),
      name: item.product_name,
      shade: item.shade_name,
    });
  }
  for (const bundle of order?.bundles || []) {
    for (const line of bundle.items || []) {
      lines.push({
        key: `bundle-${bundle.id}-${line.id}`,
        image: getOrderLineImage(line),
        name: line.product_name,
        shade: line.shade_name,
      });
    }
  }
  return lines;
}
