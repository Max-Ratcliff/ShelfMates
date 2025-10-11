/**
 * Service for fetching product information from barcodes using Open Food Facts API
 */

export interface ProductInfo {
  name: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  nutriments?: {
    energy?: number;
    fat?: number;
    carbohydrates?: number;
    proteins?: number;
    [key: string]: any;
  };
  categories?: string;
  ingredients_text?: string;
  allergens?: string;
  expiration_date?: string;
}

export interface BarcodeApiResponse {
  code: string;
  status: number;
  status_verbose: string;
  product?: ProductInfo;
}

/**
 * Fetches product information from Open Food Facts API using a barcode
 * @param barcode - The UPC/EAN barcode number
 * @returns Product information or null if not found
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    // Open Food Facts API endpoint
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'ShelfMates - Food Inventory App - Version 1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch product:', response.statusText);
      return null;
    }

    const data: BarcodeApiResponse = await response.json();

    // Check if product was found
    if (data.status === 0 || !data.product) {
      console.log('Product not found in database');
      return null;
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching product from barcode:', error);
    return null;
  }
}

/**
 * Extracts a suggested emoji based on product categories
 * @param product - The product information
 * @returns An emoji string or empty string
 */
export function suggestEmojiFromProduct(product: ProductInfo): string {
  const categories = product.categories?.toLowerCase() || '';

  // Map categories to emojis
  if (categories.includes('milk') || categories.includes('dairy')) return '🥛';
  if (categories.includes('bread') || categories.includes('bakery')) return '🍞';
  if (categories.includes('cheese')) return '🧀';
  if (categories.includes('yogurt')) return '🥛';
  if (categories.includes('egg')) return '🥚';
  if (categories.includes('meat') || categories.includes('beef') || categories.includes('pork')) return '🥩';
  if (categories.includes('chicken') || categories.includes('poultry')) return '🍗';
  if (categories.includes('fish') || categories.includes('seafood')) return '🐟';
  if (categories.includes('fruit')) {
    if (categories.includes('apple')) return '🍎';
    if (categories.includes('banana')) return '🍌';
    if (categories.includes('orange')) return '🍊';
    if (categories.includes('strawberr')) return '🍓';
    if (categories.includes('grape')) return '🍇';
    return '🍎';
  }
  if (categories.includes('vegetable')) {
    if (categories.includes('carrot')) return '🥕';
    if (categories.includes('tomato')) return '🍅';
    if (categories.includes('lettuce') || categories.includes('salad')) return '🥬';
    if (categories.includes('broccoli')) return '🥦';
    return '🥕';
  }
  if (categories.includes('beverage') || categories.includes('drink')) {
    if (categories.includes('coffee')) return '☕';
    if (categories.includes('tea')) return '🫖';
    if (categories.includes('juice')) return '🧃';
    if (categories.includes('soda')) return '🥤';
    return '🥤';
  }
  if (categories.includes('snack')) return '🍿';
  if (categories.includes('cereal')) return '🥣';
  if (categories.includes('pasta')) return '🍝';
  if (categories.includes('rice')) return '🍚';
  if (categories.includes('pizza')) return '🍕';
  if (categories.includes('sandwich')) return '🥪';
  if (categories.includes('dessert') || categories.includes('sweet')) return '🍰';
  if (categories.includes('chocolate')) return '🍫';
  if (categories.includes('cookie')) return '🍪';
  if (categories.includes('ice cream')) return '🍨';

  return ''; // No emoji suggestion
}

/**
 * Formats product name for display
 * @param product - The product information
 * @returns Formatted product name
 */
export function formatProductName(product: ProductInfo): string {
  let name = product.name || '';
  const brands = product.brands || '';
  const categories = product.categories || '';

  // Clean up the name - remove redundant brand mentions and company suffixes
  if (name) {
    // Remove common company suffixes
    name = name.replace(/,?\s*(Inc\.|LLC|Ltd\.|Corporation|Corp\.|Co\.).*$/i, '');

    // Remove redundant brand name if it appears multiple times
    const brandWords = brands.split(/[,\s]+/);
    brandWords.forEach(brandWord => {
      if (brandWord.length > 2) {
        // Count occurrences of brand word (case insensitive)
        const regex = new RegExp(brandWord, 'gi');
        const matches = name.match(regex);
        if (matches && matches.length > 1) {
          // Remove duplicate occurrences
          name = name.replace(regex, (match, offset) => {
            return offset === name.toLowerCase().indexOf(brandWord.toLowerCase()) ? match : '';
          });
        }
      }
    });

    // Clean up extra spaces and commas
    name = name.replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
    name = name.replace(/^,|,$/g, '').trim();
  }

  // If name is empty or just says "Unknown Product", try to build from category
  if (!name || name.toLowerCase().includes('unknown')) {
    if (categories) {
      // Extract the most specific category (usually the last one)
      const categoryList = categories.split(',').map(c => c.trim());
      const specificCategory = categoryList[categoryList.length - 1] || categoryList[0];

      // Capitalize first letter of each word
      const formattedCategory = specificCategory
        .split(/[\s-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      name = formattedCategory;
    } else {
      name = 'Product'; // Generic fallback
    }
  }

  // Add brand at the beginning if not already present
  if (brands && !name.toLowerCase().includes(brands.split(/[,\s]+/)[0].toLowerCase())) {
    const primaryBrand = brands.split(/[,\s]+/)[0];
    name = `${primaryBrand} ${name}`;
  }

  // Final cleanup
  name = name.replace(/\s+/g, ' ').trim();

  return name;
}

/**
 * Estimates expiry date based on product category
 * @param product - The product information
 * @returns ISO date string for suggested expiry date
 */
export function estimateExpiryDate(product: ProductInfo): string {
  const categories = product.categories?.toLowerCase() || '';
  const today = new Date();
  let daysToAdd = 365; // Default 1 year for shelf-stable items

  // Adjust days based on category
  if (categories.includes('milk') || categories.includes('yogurt')) daysToAdd = 7;
  else if (categories.includes('meat') || categories.includes('fish')) daysToAdd = 3;
  else if (categories.includes('bread')) daysToAdd = 5;
  else if (categories.includes('fruit') || categories.includes('vegetable')) daysToAdd = 5;
  else if (categories.includes('cheese')) daysToAdd = 14;
  else if (categories.includes('egg')) daysToAdd = 21;
  else if (categories.includes('canned') || categories.includes('preserved')) daysToAdd = 365;
  else if (categories.includes('frozen')) daysToAdd = 90;
  else if (categories.includes('beverage')) daysToAdd = 30;
  else if (categories.includes('pasta') || categories.includes('noodle') || categories.includes('dry')) daysToAdd = 730; // 2 years for dry goods
  else if (categories.includes('cereal') || categories.includes('grain') || categories.includes('rice')) daysToAdd = 365;
  else if (categories.includes('snack') || categories.includes('chip') || categories.includes('cracker')) daysToAdd = 180;
  else if (categories.includes('sauce') || categories.includes('condiment')) daysToAdd = 365;
  else if (categories.includes('oil')) daysToAdd = 365;
  else if (categories.includes('spice') || categories.includes('seasoning')) daysToAdd = 730;

  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);

  return expiryDate.toISOString().split('T')[0];
}
