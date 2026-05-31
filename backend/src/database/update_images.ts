import pool from './index';

async function updateImages() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update Restaurants
    console.log('Fetching restaurants...');
    const restaurantsRes = await client.query('SELECT id FROM restaurants ORDER BY created_at ASC');
    const restaurants = restaurantsRes.rows;
    
    for (let i = 0; i < restaurants.length; i++) {
      const imgNum = (i % 10) + 1; // 1 to 10
      const imgUrl = `/images/restaurants/restaurant-${imgNum}.jpg`;
      await client.query(
        'UPDATE restaurants SET image_url = $1 WHERE id = $2',
        [imgUrl, restaurants[i].id]
      );
    }
    console.log(`Updated ${restaurants.length} restaurants with local images.`);

    // 2. Update Food Items
    console.log('Fetching food items...');
    const foodItemsRes = await client.query('SELECT id, name FROM food_items');
    const foodItems = foodItemsRes.rows;

    const foodImageMap: Record<string, string> = {
      'butter chicken': 'butter-chicken.jpg',
      'chicken 65': 'chicken-65.jpg',
      'chicken dum biryani': 'chicken-dum-biryani.jpg',
      'chicken fried rice': 'chicken-fried-rice.jpg',
      'chocolate brownie': 'chocolate-brownie.jpg',
      'gulab jamun': 'gulab-jamun.jpg',
      'hakka noodles': 'hakka-noodles.jpg',
      'hyderabadi biryani': 'hyderabadi-biryani.jpg',
      'idli sambar': 'idli-sambar.jpg',
      'margherita pizza': 'margherita-pizza.jpg',
      'masala dosa': 'masala-dosa.jpg',
      'mysore dosa': 'mysore-dosa.jpg',
      'paneer butter masala': 'paneer-butter-masala.jpg',
      'veg burger': 'veg-burger.jpg',
      'veg fried rice': 'veg-fried-rice.jpg',
    };

    let updatedFoods = 0;
    for (const food of foodItems) {
      const normalizedName = food.name.toLowerCase().trim();
      let matchedImage: string | null = null;

      // Try exact match first
      if (foodImageMap[normalizedName]) {
        matchedImage = foodImageMap[normalizedName];
      } else {
        // Try partial match
        for (const [key, filename] of Object.entries(foodImageMap)) {
          if (normalizedName.includes(key) || key.includes(normalizedName)) {
            matchedImage = filename;
            break;
          }
        }
      }

      if (matchedImage) {
        await client.query(
          'UPDATE food_items SET image_url = $1 WHERE id = $2',
          [`/images/foods/${matchedImage}`, food.id]
        );
        updatedFoods++;
      }
    }
    
    console.log(`Updated ${updatedFoods} out of ${foodItems.length} food items with local images.`);

    await client.query('COMMIT');
    console.log('Database update complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating images:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateImages();
