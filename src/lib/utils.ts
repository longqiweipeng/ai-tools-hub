export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getPriceLabel(price: string): string {
  const labels: Record<string, string> = {
    free: '免费',
    freemium: '免费增值',
    paid: '付费',
    usage: '按量付费',
  };
  return labels[price] || price;
}
