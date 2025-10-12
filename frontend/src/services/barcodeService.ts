/**
 * Service for fetching product information from barcodes using Open Food Facts API
 */

export interface ExpiryEstimation {
  date: string;
  message?: string; // User-friendly message explaining why date is blank or estimated
  confidence: 'high' | 'medium' | 'low' | 'none'; // Confidence level of the estimation
}

export interface ProductInfo {
  name: string;
  product_name?: string;
  generic_name?: string;
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
  categories_tags?: string[];
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

// UPC Database API response interface
interface UPCDatabaseItem {
  ean: string;
  title: string;
  description?: string;
  upc?: string;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  dimension?: string;
  weight?: string;
  category?: string;
  currency?: string;
  lowest_recorded_price?: number;
  highest_recorded_price?: number;
  images?: string[];
  offers?: any[];
}

interface UPCDatabaseResponse {
  code: string;
  total: number;
  offset: number;
  items: UPCDatabaseItem[];
}

/**
 * Fetches product information from Open Food Facts API using a barcode
 * @param barcode - The UPC/EAN barcode number
 * @returns Product information or null if not found
 */
async function fetchFromOpenFoodFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'ShelfMates - Food Inventory App - Version 1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Open Food Facts API error:', response.statusText);
      return null;
    }

    const data: BarcodeApiResponse = await response.json();

    if (data.status === 0 || !data.product) {
      console.log('Product not found in Open Food Facts');
      return null;
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
}

/**
 * Fetches product information from UPC Database API using a barcode (via backend proxy)
 * @param barcode - The UPC/EAN barcode number
 * @returns Product information or null if not found
 */
async function fetchFromUPCDatabase(barcode: string): Promise<ProductInfo | null> {
  try {
    // Use backend proxy to bypass CORS
    const response = await fetch(
      `http://localhost:8000/api/barcode/upc/${barcode}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('UPC Database API error:', response.statusText);
      return null;
    }

    const data: UPCDatabaseResponse = await response.json();

    if (data.total === 0 || !data.items || data.items.length === 0) {
      console.log('Product not found in UPC Database');
      return null;
    }

    // Convert UPC Database format to our ProductInfo format
    const item = data.items[0];

    return {
      name: item.title,
      product_name: item.title,
      brands: item.brand,
      categories: item.category,
      quantity: item.size,
      image_url: item.images?.[0],
    };
  } catch (error) {
    console.error('Error fetching from UPC Database:', error);
    return null;
  }
}

/**
 * Checks if product data is too generic or incomplete
 */
function isGenericProductData(product: ProductInfo | null): boolean {
  if (!product) return true;

  const name = (product.product_name || product.name || '').toLowerCase();
  const hasGenericName =
    !name ||
    name.includes('unknown') ||
    name === 'dishes' ||
    name === 'product' ||
    name === 'food' ||
    name.length < 3;

  const hasNoCategories = !product.categories || product.categories.length < 5;

  return hasGenericName || hasNoCategories;
}

/**
 * Merges product data from multiple sources, prioritizing the best information
 */
function mergeProductData(primary: ProductInfo | null, fallback: ProductInfo | null): ProductInfo | null {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;

  // Merge, preferring more complete data
  return {
    name: primary.name || fallback.name,
    product_name: primary.product_name || fallback.product_name || primary.name || fallback.name,
    generic_name: primary.generic_name,
    brands: primary.brands || fallback.brands,
    quantity: primary.quantity || fallback.quantity,
    image_url: primary.image_url || fallback.image_url,
    nutriments: primary.nutriments, // Only from Open Food Facts
    categories: primary.categories || fallback.categories,
    categories_tags: primary.categories_tags,
    ingredients_text: primary.ingredients_text,
    allergens: primary.allergens,
    expiration_date: primary.expiration_date,
  };
}

/**
 * Fetches product information from multiple APIs with fallback
 * @param barcode - The UPC/EAN barcode number
 * @returns Product information or null if not found
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  console.log('Fetching product for barcode:', barcode);

  // Try Open Food Facts first (better for nutrition data)
  const openFoodProduct = await fetchFromOpenFoodFacts(barcode);

  // If Open Food Facts has good data, use it
  if (openFoodProduct && !isGenericProductData(openFoodProduct)) {
    console.log('Using Open Food Facts data');
    return openFoodProduct;
  }

  // If data is poor/missing, try UPC Database as fallback
  console.log('Open Food Facts data incomplete, trying UPC Database...');
  const upcProduct = await fetchFromUPCDatabase(barcode);

  // Merge the best data from both sources
  const merged = mergeProductData(openFoodProduct, upcProduct);

  if (merged) {
    console.log('Using merged data from both sources');
  } else {
    console.log('No product data found in any source');
  }

  return merged;
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
  // Try to get the most specific name available
  let name = product.product_name || product.generic_name || product.name || '';
  const brands = product.brands || '';
  const categories = product.categories || '';

  // Clean up the name - remove redundant brand mentions and company suffixes
  if (name) {
    // Remove common company suffixes
    name = name.replace(/,?\s*(Inc\.|LLC|Ltd\.|Corporation|Corp\.|Co\.).*$/i, '');

    // Remove redundant brand name if it appears multiple times
    const brandParts = brands.split(',').map(b => b.trim());
    brandParts.forEach(brand => {
      if (brand.length > 2) {
        // Count occurrences of brand (case insensitive)
        const regex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = name.match(regex);
        if (matches && matches.length > 1) {
          // Remove duplicate occurrences (keep first one)
          let found = false;
          name = name.replace(regex, (match) => {
            if (!found) {
              found = true;
              return match;
            }
            return '';
          });
        }
      }
    });

    // Clean up extra spaces and commas
    name = name.replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
    name = name.replace(/^,|,$/g, '').trim();
  }

  // If name is empty, too generic, or just says "Unknown Product", try to build from category
  const isGenericName = !name ||
                        name.toLowerCase().includes('unknown') ||
                        name.toLowerCase() === 'dishes' ||
                        name.toLowerCase().includes('product');

  if (isGenericName) {
    if (categories) {
      // Extract the most specific category (usually the last one, but skip super generic ones)
      const categoryList = categories.split(',').map(c => c.trim());

      // Filter out super generic categories
      const specificCategories = categoryList.filter(cat => {
        const lower = cat.toLowerCase();
        return !lower.includes('food') &&
               !lower.includes('groceries') &&
               lower.length > 3;
      });

      const specificCategory = specificCategories[specificCategories.length - 1] ||
                              specificCategories[0] ||
                              categoryList[categoryList.length - 1];

      // Capitalize first letter of each word
      const formattedCategory = specificCategory
        .split(/[\s-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      name = formattedCategory;

      // If we still have a generic name like "Dishes", try to add more context
      if (name.toLowerCase().includes('dishes') || name.toLowerCase().includes('meals')) {
        // Look for more specific sub-categories
        const moreSpecific = categoryList
          .reverse()
          .find(cat =>
            !cat.toLowerCase().includes('food') &&
            !cat.toLowerCase().includes('dishes') &&
            !cat.toLowerCase().includes('meals') &&
            cat.length > 3
          );

        if (moreSpecific) {
          const formatted = moreSpecific
            .split(/[\s-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          name = formatted;
        }
      }
    } else {
      name = 'Product'; // Generic fallback
    }
  }

  // Add brand at the beginning if not already present
  if (brands) {
    // Split only on commas, not spaces, to preserve multi-word brands like "RICE A RONI"
    const primaryBrand = brands.split(',')[0].trim();
    const brandLower = primaryBrand.toLowerCase();
    const nameLower = name.toLowerCase();

    // Check if brand is already at the start of the name (more strict check)
    const startsWithBrand = nameLower.startsWith(brandLower) ||
                           nameLower.startsWith(brandLower.replace(/-/g, ' '));

    if (!startsWithBrand) {
      name = `${primaryBrand} ${name}`;
    }
  }

  // Final cleanup
  name = name.replace(/\s+/g, ' ').trim();

  // Capitalize properly (first letter of each word)
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name;
}

/**
 * Checks if a product is perishable based on category
 * @param product - The product information
 * @returns true if perishable, false otherwise
 */
export function isPerishable(product: ProductInfo): boolean {
  const categories = product.categories?.toLowerCase() || '';

  // Only consider these as perishable (short shelf life)
  return (
    categories.includes('milk') ||
    categories.includes('yogurt') ||
    categories.includes('dairy') ||
    categories.includes('meat') ||
    categories.includes('fish') ||
    categories.includes('seafood') ||
    categories.includes('bread') ||
    categories.includes('fresh') ||
    categories.includes('fruit') ||
    categories.includes('vegetable') ||
    categories.includes('produce') ||
    categories.includes('cheese') ||
    categories.includes('egg') ||
    categories.includes('deli')
  );
}

/**
 * Estimates expiry date based on product category - ONLY for perishables
 * Returns empty string for shelf-stable items (user should check package)
 * @param product - The product information
 * @returns ExpiryEstimation with date and user-friendly message
 */
export async function estimateExpiryDate(product: ProductInfo): Promise<ExpiryEstimation> {
  // Check if Open Food Facts has shelf life data
  if (product.expiration_date) {
    return {
      date: product.expiration_date,
      message: 'Expiry date from product database',
      confidence: 'high'
    };
  }

  // Try to get accurate shelf life from USDA FoodKeeper
  const { searchFoodKeeperProduct, getShelfLifeDays } = await import('./foodKeeperService');

  const productName = product.product_name || product.name;
  const category = product.categories?.split(',')[0]?.trim();

  const foodKeeperProduct = await searchFoodKeeperProduct(productName, category);

  if (foodKeeperProduct) {
    const shelfLifeDays = getShelfLifeDays(foodKeeperProduct);
    console.log(`FoodKeeper product: ${foodKeeperProduct.name}, shelf life days: ${shelfLifeDays}`);
    console.log('Storage data:', {
      dop_refrigerate: `${foodKeeperProduct.dop_refrigerate_min}-${foodKeeperProduct.dop_refrigerate_max} ${foodKeeperProduct.dop_refrigerate_metric}`,
      refrigerate: `${foodKeeperProduct.refrigerate_min}-${foodKeeperProduct.refrigerate_max} ${foodKeeperProduct.refrigerate_metric}`,
      pantry: `${foodKeeperProduct.pantry_min}-${foodKeeperProduct.pantry_max} ${foodKeeperProduct.pantry_metric}`,
    });

    if (shelfLifeDays > 0) {
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
      console.log(`Using FoodKeeper shelf life: ${shelfLifeDays} days for ${foodKeeperProduct.name}`);
      return {
        date: expiryDate.toISOString().split('T')[0],
        message: `Estimated from USDA data for ${foodKeeperProduct.name}`,
        confidence: 'high'
      };
    }
  }

  // Fall back to category-based estimation
  const categories = product.categories?.toLowerCase() || '';
  const productNameLower = (product.product_name || product.name || '').toLowerCase();

  console.log('FoodKeeper returned 0 days, falling back to category-based estimation');
  console.log('Product categories:', product.categories);
  console.log('Product name:', productNameLower);

  // Check if it's a preserved/shelf-stable product first
  const isPreservedProduct = productNameLower.includes('spread') ||
                             productNameLower.includes('jam') ||
                             productNameLower.includes('jelly') ||
                             productNameLower.includes('preserve') ||
                             productNameLower.includes('jarred') ||
                             productNameLower.includes('canned') ||
                             productNameLower.includes('sauce') ||
                             productNameLower.includes('syrup') ||
                             productNameLower.includes('honey') ||
                             productNameLower.includes('marmalade') ||
                             productNameLower.includes('chutney') ||
                             productNameLower.includes('paste');

  if (isPreservedProduct) {
    console.log('Product is a preserved/jarred good - leaving expiry date blank (user should check package)');
    return {
      date: '',
      message: 'This is a shelf-stable product. Please check the "Best By" or "Use By" date on the package.',
      confidence: 'none'
    };
  }

  // If no categories, try to infer from product name (only for fresh items)
  let inferredCategory = '';
  if (!categories) {
    if (productNameLower.includes('milk') || productNameLower.includes('yogurt') || productNameLower.includes('dairy')) {
      inferredCategory = 'dairy';
    } else if (productNameLower.includes('cheese')) {
      inferredCategory = 'cheese';
    } else if (productNameLower.includes('meat') || productNameLower.includes('beef') || productNameLower.includes('pork') || productNameLower.includes('chicken')) {
      inferredCategory = 'meat';
    } else if (productNameLower.includes('fish') || productNameLower.includes('seafood')) {
      inferredCategory = 'fish';
    } else if (productNameLower.includes('bread') || productNameLower.includes('bakery')) {
      inferredCategory = 'bread';
    } else if (productNameLower.includes('fresh fruit') || productNameLower.includes('fresh berry')) {
      inferredCategory = 'fruit';
    } else if (productNameLower.includes('fresh vegetable') || productNameLower.includes('lettuce') || productNameLower.includes('carrot')) {
      inferredCategory = 'vegetable';
    } else if (productNameLower.includes('egg')) {
      inferredCategory = 'egg';
    } else if (productNameLower.includes('deli') || productNameLower.includes('sandwich')) {
      inferredCategory = 'deli';
    }

    if (inferredCategory) {
      console.log(`Inferred category from product name: ${inferredCategory}`);
    }
  }

  const categoryToCheck = categories || inferredCategory;
  const isPerishableProduct = categoryToCheck ?
    (categoryToCheck.includes('milk') ||
     categoryToCheck.includes('yogurt') ||
     categoryToCheck.includes('dairy') ||
     categoryToCheck.includes('meat') ||
     categoryToCheck.includes('fish') ||
     categoryToCheck.includes('seafood') ||
     categoryToCheck.includes('bread') ||
     categoryToCheck.includes('fresh') ||
     categoryToCheck.includes('fruit') ||
     categoryToCheck.includes('vegetable') ||
     categoryToCheck.includes('produce') ||
     categoryToCheck.includes('cheese') ||
     categoryToCheck.includes('egg') ||
     categoryToCheck.includes('deli')) : false;

  console.log('Is perishable?', isPerishableProduct);

  // Only estimate for perishables, leave blank for shelf-stable
  if (!isPerishableProduct) {
    console.log('Product is not perishable, leaving expiry date blank');
    return {
      date: '',
      message: 'Could not determine product type. If perishable, please enter expiry date manually.',
      confidence: 'none'
    };
  }

  const today = new Date();
  let daysToAdd = 7; // Default for perishables

  // Estimate only for perishable items - use inferred category if no actual category
  if (categoryToCheck.includes('milk') || categoryToCheck.includes('yogurt') || categoryToCheck.includes('dairy')) {
    daysToAdd = 7;
  } else if (categoryToCheck.includes('meat') || categoryToCheck.includes('fish') || categoryToCheck.includes('seafood')) {
    daysToAdd = 3;
  } else if (categoryToCheck.includes('bread')) {
    daysToAdd = 5;
  } else if (categoryToCheck.includes('fruit') || categoryToCheck.includes('vegetable') || categoryToCheck.includes('produce')) {
    daysToAdd = 5;
  } else if (categoryToCheck.includes('cheese')) {
    daysToAdd = 14;
  } else if (categoryToCheck.includes('egg')) {
    daysToAdd = 21;
  } else if (categoryToCheck.includes('deli')) {
    daysToAdd = 3;
  }

  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);

  const dateString = expiryDate.toISOString().split('T')[0];
  console.log(`Using category-based estimation: ${daysToAdd} days, expiry date: ${dateString}`);
  return {
    date: dateString,
    message: `Estimated based on product category (approximately ${daysToAdd} days). Please verify with package date if available.`,
    confidence: 'medium'
  };
}
