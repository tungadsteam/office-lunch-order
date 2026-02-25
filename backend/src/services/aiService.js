/**
 * Fake AI Service - Simulates menu extraction from image
 * In production, this would call OpenAI Vision API or similar
 */

const predefinedItems = [
  { name: 'Đùi gà rán', price: 35000 },
  { name: 'Cánh gà chiên mắm', price: 30000 },
  { name: 'Khoai tây chiên', price: 25000 },
  { name: 'Gà rán sốt cay', price: 40000 },
  { name: 'Burger bò phô mai', price: 45000 },
  { name: 'Sandwich trứng', price: 30000 },
  { name: 'Pizza mini', price: 35000 },
  { name: 'Hotdog xúc xích', price: 25000 },
  { name: 'Pepsi lon', price: 12000 },
  { name: 'Coca Cola lon', price: 12000 },
  { name: 'Trà đào', price: 20000 },
  { name: 'Trà sữa trân châu', price: 30000 },
  { name: 'Bánh mì thịt', price: 20000 },
  { name: 'Xôi gà', price: 25000 },
  { name: 'Nem rán', price: 15000 },
  { name: 'Chả giò', price: 18000 },
  { name: 'Gỏi cuốn (2 cuốn)', price: 20000 },
  { name: 'Bánh bao nhân thịt', price: 15000 },
  { name: 'Sữa chua nếp cẩm', price: 15000 },
  { name: 'Trái cây cắt', price: 20000 },
];

/**
 * Fake AI: Extract menu items from image URL
 * Returns random 4-8 items from predefined list
 */
async function extractMenuFromImage(imageUrl) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const count = Math.floor(Math.random() * 5) + 4; // 4-8 items
  const shuffled = [...predefinedItems].sort(() => 0.5 - Math.random());
  const items = shuffled.slice(0, count);

  return {
    items: items.map((item, i) => ({
      name: item.name,
      price: item.price,
      display_order: i,
    })),
    source: 'fake-ai',
    confidence: 0.85,
  };
}

module.exports = { extractMenuFromImage };
