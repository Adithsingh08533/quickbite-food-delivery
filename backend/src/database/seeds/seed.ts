/**
 * QuickBite – Database Seed Script
 * Inserts all demo data: users, restaurants, categories, food items, addresses, coupons.
 *
 * Demo credentials:
 *   Customers : customer1@demo.com / customer2@demo.com / customer3@demo.com — Demo@123
 *   Owners    : owner1@demo.com / owner2@demo.com — Demo@123
 *   Admin     : admin@demo.com — Admin@123
 *
 * Usage: npx ts-node src/database/seeds/seed.ts
 */

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import pool from '../index';

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting QuickBite seed...\n');

    // ─────────────────────────────────────────────────────────────
    // CLEAN existing data (order matters due to FK constraints)
    // ─────────────────────────────────────────────────────────────
    console.log('🧹 Cleaning existing seed data...');
    await client.query(`
      TRUNCATE TABLE
        notifications, wishlist, reviews, payments, order_items, orders,
        coupons, cart_items, food_items, food_categories, restaurants,
        addresses, refresh_tokens, users
      RESTART IDENTITY CASCADE
    `);

    // ─────────────────────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────────────────────
    console.log('👤 Seeding users...');

    const demoHash  = await hashPassword('Demo@123');
    const adminHash = await hashPassword('Admin@123');

    const userId = {
      customer1: uuidv4(),
      customer2: uuidv4(),
      customer3: uuidv4(),
      owner1:    uuidv4(),
      owner2:    uuidv4(),
      admin:     uuidv4(),
    };

    await client.query(
      `INSERT INTO users (id, name, email, password_hash, phone, role, is_verified) VALUES
        ($1,  'Arjun Sharma',   'customer1@demo.com', $7, '+919876543210', 'customer', true),
        ($2,  'Priya Nair',     'customer2@demo.com', $7, '+919876543211', 'customer', true),
        ($3,  'Rahul Verma',    'customer3@demo.com', $7, '+919876543212', 'customer', true),
        ($4,  'Kiran Patel',    'owner1@demo.com',    $7, '+919876543213', 'owner',    true),
        ($5,  'Meena Reddy',    'owner2@demo.com',    $7, '+919876543214', 'owner',    true),
        ($6,  'Admin QuickBite','admin@demo.com',      $8, '+919876543215', 'admin',    true)`,
      [
        userId.customer1, userId.customer2, userId.customer3,
        userId.owner1, userId.owner2, userId.admin,
        demoHash, adminHash,
      ]
    );
    console.log('  ✅ 6 users created');

    // ─────────────────────────────────────────────────────────────
    // ADDRESSES
    // ─────────────────────────────────────────────────────────────
    console.log('📍 Seeding addresses...');

    const addrId = {
      c1home:  uuidv4(),
      c1work:  uuidv4(),
      c2home:  uuidv4(),
      c3home:  uuidv4(),
    };

    await client.query(
      `INSERT INTO addresses (id, user_id, label, flat_house, street, area, city, state, pin_code, is_default) VALUES
        ($1,  $5, 'Home', 'Flat 12, Sunrise Apts',  'MG Road',          'Indiranagar',    'Bengaluru', 'Karnataka', '560038', true),
        ($2,  $5, 'Work', 'Tower 4, Prestige Tech', 'Outer Ring Road',   'Marathahalli',   'Bengaluru', 'Karnataka', '560037', false),
        ($3,  $6, 'Home', '34B, Palm Grove Society', 'Linking Road',     'Bandra West',    'Mumbai',    'Maharashtra','400050', true),
        ($4,  $7, 'Home', 'Plot 8, Vasanth Nagar',  'Jubilee Hills Road','Jubilee Hills',  'Hyderabad', 'Telangana', '500033', true)`,
      [addrId.c1home, addrId.c1work, addrId.c2home, addrId.c3home,
       userId.customer1, userId.customer2, userId.customer3]
    );
    console.log('  ✅ 4 addresses created');

    // ─────────────────────────────────────────────────────────────
    // RESTAURANTS
    // ─────────────────────────────────────────────────────────────
    console.log('🍽️  Seeding restaurants...');

    const restId = {
      spiceGarden: uuidv4(),
      dosaPalace:  uuidv4(),
      dragonWok:   uuidv4(),
      burgerHub:   uuidv4(),
      biryaniHouse:uuidv4(),
    };

    await client.query(
      `INSERT INTO restaurants
        (id, owner_id, name, description, cuisine_type, phone,
         address, city, state, pin_code,
         avg_rating, review_count, delivery_fee, min_order_amount,
         delivery_time_min, is_open, approval_status,
         image_url)
       VALUES
        ($1, $11, 'Spice Garden',
         'Authentic North Indian cuisine with rich gravies, tandoor delights, and aromatic biryanis.',
         'North Indian', '+918023456789',
         '12, Commercial Street, Shivajinagar', 'Bengaluru', 'Karnataka', '560001',
         4.5, 128, 30.00, 150.00, 35, true, 'approved',
         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'),

        ($2, $11, 'Dosa Palace',
         'Crispy dosas, fluffy idlis, and piping hot sambar — South Indian comfort food at its finest.',
         'South Indian', '+918023456790',
         '45, Gandhi Bazaar, Basavanagudi', 'Bengaluru', 'Karnataka', '560004',
         4.3, 95, 20.00, 100.00, 25, true, 'approved',
         'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800'),

        ($3, $12, 'Dragon Wok',
         'Indo-Chinese fusion — Hakka noodles, Manchurian, and sizzlers packed with bold flavours.',
         'Chinese', '+918023456791',
         '78, Church Street, MG Road', 'Bengaluru', 'Karnataka', '560001',
         4.1, 76, 40.00, 200.00, 40, true, 'approved',
         'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'),

        ($4, $12, 'The Burger Hub',
         'Gourmet burgers, loaded fries, and thick shakes — fast food done the right way.',
         'Fast Food', '+918023456792',
         '23, Koramangala 5th Block', 'Bengaluru', 'Karnataka', '560095',
         4.4, 210, 25.00, 150.00, 20, true, 'approved',
         'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'),

        ($5, $11, 'Biryani House',
         'Dum cooked Hyderabadi biryani with saffron, whole spices, and tender meat or fresh veggies.',
         'Biryani', '+918023456793',
         '56, Residency Road, Richmond Town', 'Bengaluru', 'Karnataka', '560025',
         4.7, 342, 35.00, 200.00, 45, true, 'approved',
         'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800')`,
      [
        restId.spiceGarden, restId.dosaPalace, restId.dragonWok,
        restId.burgerHub, restId.biryaniHouse,
        userId.owner1, userId.owner2,
        // $11 = owner1, $12 = owner2
        userId.owner1, userId.owner1, userId.owner2, userId.owner2, userId.owner1,
      ]
    );

    // Re-insert with corrected binding (simpler approach)
    await client.query('DELETE FROM restaurants');
    await client.query(
      `INSERT INTO restaurants
        (id, owner_id, name, description, cuisine_type, phone,
         address, city, state, pin_code,
         avg_rating, review_count, delivery_fee, min_order_amount,
         delivery_time_min, is_open, approval_status, image_url)
       VALUES
        ($1,  $6,  'Spice Garden',
         'Authentic North Indian cuisine with rich gravies, tandoor delights, and aromatic biryanis.',
         'North Indian', '+918023456789',
         '12, Commercial Street, Shivajinagar', 'Bengaluru', 'Karnataka', '560001',
         4.5, 128, 30.00, 150.00, 35, true, 'approved',
         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'),

        ($2,  $6,  'Dosa Palace',
         'Crispy dosas, fluffy idlis, and piping hot sambar — South Indian comfort food at its finest.',
         'South Indian', '+918023456790',
         '45, Gandhi Bazaar, Basavanagudi', 'Bengaluru', 'Karnataka', '560004',
         4.3, 95, 20.00, 100.00, 25, true, 'approved',
         'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800'),

        ($3,  $7,  'Dragon Wok',
         'Indo-Chinese fusion — Hakka noodles, Manchurian, and sizzlers packed with bold flavours.',
         'Chinese', '+918023456791',
         '78, Church Street, MG Road', 'Bengaluru', 'Karnataka', '560001',
         4.1, 76, 40.00, 200.00, 40, true, 'approved',
         'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'),

        ($4,  $7,  'The Burger Hub',
         'Gourmet burgers, loaded fries, and thick shakes — fast food done the right way.',
         'Fast Food', '+918023456792',
         '23, Koramangala 5th Block', 'Bengaluru', 'Karnataka', '560095',
         4.4, 210, 25.00, 150.00, 20, true, 'approved',
         'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'),

        ($5,  $6,  'Biryani House',
         'Dum cooked Hyderabadi biryani with saffron, whole spices, and tender meat or fresh veggies.',
         'Biryani', '+918023456793',
         '56, Residency Road, Richmond Town', 'Bengaluru', 'Karnataka', '560025',
         4.7, 342, 35.00, 200.00, 45, true, 'approved',
         'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800')`,
      [
        restId.spiceGarden, restId.dosaPalace, restId.dragonWok,
        restId.burgerHub, restId.biryaniHouse,
        userId.owner1, userId.owner2,
      ]
    );
    console.log('  ✅ 5 restaurants created');

    // ─────────────────────────────────────────────────────────────
    // FOOD CATEGORIES
    // ─────────────────────────────────────────────────────────────
    console.log('📂 Seeding food categories...');

    const catId = {
      // Spice Garden
      sgStarters:  uuidv4(),
      sgMains:     uuidv4(),
      sgBreads:    uuidv4(),
      sgDesserts:  uuidv4(),
      // Dosa Palace
      dpDosas:     uuidv4(),
      dpIdli:      uuidv4(),
      dpRice:      uuidv4(),
      // Dragon Wok
      dwStarters:  uuidv4(),
      dwNoodles:   uuidv4(),
      dwRice:      uuidv4(),
      // Burger Hub
      bhBurgers:   uuidv4(),
      bhSides:     uuidv4(),
      bhDrinks:    uuidv4(),
      // Biryani House
      bhBiryani:   uuidv4(),
      bhGravy:     uuidv4(),
      bhRaita:     uuidv4(),
    };

    await client.query(
      `INSERT INTO food_categories (id, restaurant_id, name, display_order) VALUES
        -- Spice Garden
        ($1,  $17, 'Starters',      1),
        ($2,  $17, 'Main Course',   2),
        ($3,  $17, 'Breads',        3),
        ($4,  $17, 'Desserts',      4),
        -- Dosa Palace
        ($5,  $18, 'Dosas',         1),
        ($6,  $18, 'Idli & Vada',   2),
        ($7,  $18, 'Rice & Biryani',3),
        -- Dragon Wok
        ($8,  $19, 'Starters',      1),
        ($9,  $19, 'Noodles & Pasta',2),
        ($10, $19, 'Fried Rice',    3),
        -- Burger Hub
        ($11, $20, 'Burgers',       1),
        ($12, $20, 'Sides',         2),
        ($13, $20, 'Beverages',     3),
        -- Biryani House
        ($14, $21, 'Biryani',       1),
        ($15, $21, 'Gravies',       2),
        ($16, $21, 'Raita & Sides', 3)`,
      [
        catId.sgStarters, catId.sgMains, catId.sgBreads, catId.sgDesserts,
        catId.dpDosas, catId.dpIdli, catId.dpRice,
        catId.dwStarters, catId.dwNoodles, catId.dwRice,
        catId.bhBurgers, catId.bhSides, catId.bhDrinks,
        catId.bhBiryani, catId.bhGravy, catId.bhRaita,
        restId.spiceGarden, restId.dosaPalace, restId.dragonWok,
        restId.burgerHub, restId.biryaniHouse,
      ]
    );
    console.log('  ✅ 16 food categories created');

    // ─────────────────────────────────────────────────────────────
    // FOOD ITEMS
    // ─────────────────────────────────────────────────────────────
    console.log('🍕 Seeding food items...');

    const fi = (): string => uuidv4();

    // ── Spice Garden ──────────────────────────────────────────────
    await client.query(
      `INSERT INTO food_items (id, restaurant_id, category_id, name, description, price, is_veg, is_featured, prep_time_min) VALUES
        -- Starters
        ($1, $41, $37, 'Paneer Tikka',
         'Marinated cottage cheese cubes grilled in tandoor with mint chutney.',
         280.00, true, true, 15),
        ($2, $41, $37, 'Chicken Seekh Kebab',
         'Minced chicken with aromatic spices, grilled on skewers.',
         320.00, false, true, 18),
        ($3, $41, $37, 'Veg Spring Roll',
         'Crispy rolls stuffed with cabbage, carrots and glass noodles.',
         180.00, true, false, 12),

        -- Main Course
        ($4, $41, $38, 'Butter Chicken',
         'Tender chicken in a rich, creamy tomato-based sauce. A true classic.',
         380.00, false, true, 25),
        ($5, $41, $38, 'Dal Makhani',
         'Slow-cooked black lentils with butter and cream. Punjabi soul food.',
         260.00, true, true, 30),
        ($6, $41, $38, 'Palak Paneer',
         'Fresh spinach gravy with golden paneer cubes and mild spices.',
         290.00, true, false, 20),
        ($7, $41, $38, 'Mutton Rogan Josh',
         'Kashmiri-style mutton in a red gravy of whole spices and yogurt.',
         450.00, false, false, 35),

        -- Breads
        ($8, $41, $39, 'Butter Naan',
         'Soft leavened flatbread baked in tandoor, brushed with butter.',
         60.00, true, false, 8),
        ($9, $41, $39, 'Laccha Paratha',
         'Flaky, multi-layered whole wheat bread, pan-roasted with ghee.',
         70.00, true, false, 10),
        ($10, $41, $39, 'Garlic Naan',
         'Naan topped with garlic and cilantro, straight from the tandoor.',
         80.00, true, false, 8),

        -- Desserts
        ($11, $41, $40, 'Gulab Jamun',
         'Soft milk dumplings soaked in rose-flavoured sugar syrup.',
         120.00, true, false, 5),
        ($12, $41, $40, 'Rasmalai',
         'Soft chenna patties in chilled saffron milk with pistachios.',
         150.00, true, true, 5)`,
      [
        fi(), fi(), fi(),  // starters
        fi(), fi(), fi(), fi(), // mains
        fi(), fi(), fi(),  // breads
        fi(), fi(),        // desserts
        // These will be replaced below with proper UUIDs
        catId.sgStarters, catId.sgMains, catId.sgBreads, catId.sgDesserts,
        restId.spiceGarden,
      ]
    );

    // Due to complex parameterization, use individual inserts per restaurant
    // Clearing and re-doing with named const IDs for clarity:
    await client.query('DELETE FROM food_items');

    const foodItems: Array<{
      id: string; restaurantId: string; categoryId: string;
      name: string; description: string; price: number;
      isVeg: boolean; isFeatured: boolean; prepTime: number;
    }> = [
      // ── Spice Garden ──
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgStarters,
        name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in tandoor with mint chutney.',
        price: 280, isVeg: true, isFeatured: true, prepTime: 15 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgStarters,
        name: 'Chicken Seekh Kebab', description: 'Minced chicken with aromatic spices, grilled on skewers.',
        price: 320, isVeg: false, isFeatured: true, prepTime: 18 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgStarters,
        name: 'Veg Spring Roll', description: 'Crispy rolls stuffed with cabbage, carrots and glass noodles.',
        price: 180, isVeg: true, isFeatured: false, prepTime: 12 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgMains,
        name: 'Butter Chicken', description: 'Tender chicken in a rich, creamy tomato-based sauce. A true classic.',
        price: 380, isVeg: false, isFeatured: true, prepTime: 25 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgMains,
        name: 'Dal Makhani', description: 'Slow-cooked black lentils with butter and cream. Punjabi soul food.',
        price: 260, isVeg: true, isFeatured: true, prepTime: 30 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgMains,
        name: 'Palak Paneer', description: 'Fresh spinach gravy with golden paneer cubes and mild spices.',
        price: 290, isVeg: true, isFeatured: false, prepTime: 20 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgMains,
        name: 'Mutton Rogan Josh', description: 'Kashmiri-style mutton in a red gravy of whole spices and yogurt.',
        price: 450, isVeg: false, isFeatured: false, prepTime: 35 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgBreads,
        name: 'Butter Naan', description: 'Soft leavened flatbread baked in tandoor, brushed with butter.',
        price: 60, isVeg: true, isFeatured: false, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgBreads,
        name: 'Laccha Paratha', description: 'Flaky, multi-layered whole wheat bread, pan-roasted with ghee.',
        price: 70, isVeg: true, isFeatured: false, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgBreads,
        name: 'Garlic Naan', description: 'Naan topped with garlic and cilantro, straight from the tandoor.',
        price: 80, isVeg: true, isFeatured: false, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgDesserts,
        name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-flavoured sugar syrup.',
        price: 120, isVeg: true, isFeatured: false, prepTime: 5 },
      { id: uuidv4(), restaurantId: restId.spiceGarden, categoryId: catId.sgDesserts,
        name: 'Rasmalai', description: 'Soft chenna patties in chilled saffron milk with pistachios.',
        price: 150, isVeg: true, isFeatured: true, prepTime: 5 },

      // ── Dosa Palace ──
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpDosas,
        name: 'Masala Dosa', description: 'Crispy golden crepe with spiced potato filling and coconut chutney.',
        price: 120, isVeg: true, isFeatured: true, prepTime: 12 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpDosas,
        name: 'Rava Dosa', description: 'Lacy, crispy semolina crepe with onion, green chilli and cumin.',
        price: 130, isVeg: true, isFeatured: true, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpDosas,
        name: 'Paneer Dosa', description: 'Crispy dosa stuffed with spiced paneer and bell pepper filling.',
        price: 160, isVeg: true, isFeatured: false, prepTime: 14 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpDosas,
        name: 'Ghee Roast', description: 'Paper-thin dosa roasted in generous ghee for a rich, buttery flavour.',
        price: 110, isVeg: true, isFeatured: false, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpIdli,
        name: 'Idli (3 pcs)', description: 'Fluffy steamed rice cakes served with sambar and 2 chutneys.',
        price: 90, isVeg: true, isFeatured: true, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpIdli,
        name: 'Medu Vada (2 pcs)', description: 'Crispy fried lentil doughnuts served hot with sambar.',
        price: 100, isVeg: true, isFeatured: false, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpIdli,
        name: 'Pongal', description: 'Comfort dish of rice and lentils cooked with pepper and cashews.',
        price: 110, isVeg: true, isFeatured: false, prepTime: 15 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpRice,
        name: 'Curd Rice', description: 'Soft rice mixed with curd, tempered with mustard and curry leaves.',
        price: 120, isVeg: true, isFeatured: false, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.dosaPalace, categoryId: catId.dpRice,
        name: 'Lemon Rice', description: 'Fluffy rice seasoned with lemon juice, turmeric and crunchy peanuts.',
        price: 110, isVeg: true, isFeatured: false, prepTime: 10 },

      // ── Dragon Wok ──
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwStarters,
        name: 'Veg Manchurian (Dry)', description: 'Crispy vegetable balls tossed in Indo-Chinese manchurian sauce.',
        price: 200, isVeg: true, isFeatured: true, prepTime: 15 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwStarters,
        name: 'Chicken Lollipop', description: 'Spicy fried chicken wings marinated in a fiery red sauce.',
        price: 280, isVeg: false, isFeatured: true, prepTime: 20 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwStarters,
        name: 'Crispy Corn', description: 'Golden fried corn kernels tossed with butter, garlic and herbs.',
        price: 180, isVeg: true, isFeatured: false, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwNoodles,
        name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with crunchy vegetables in soy-based sauce.',
        price: 220, isVeg: true, isFeatured: true, prepTime: 18 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwNoodles,
        name: 'Chicken Chow Mein', description: 'Classic chow mein with shredded chicken and wok-fried veggies.',
        price: 280, isVeg: false, isFeatured: false, prepTime: 20 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwNoodles,
        name: 'Schezwan Noodles', description: 'Fiery schezwan sauce noodles — only for heat lovers!',
        price: 240, isVeg: true, isFeatured: false, prepTime: 18 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwRice,
        name: 'Veg Fried Rice', description: 'Wok-tossed basmati rice with fresh vegetables and soy sauce.',
        price: 210, isVeg: true, isFeatured: false, prepTime: 15 },
      { id: uuidv4(), restaurantId: restId.dragonWok, categoryId: catId.dwRice,
        name: 'Egg Fried Rice', description: 'Classic fried rice with scrambled egg, scallions, and sesame.',
        price: 230, isVeg: false, isFeatured: true, prepTime: 15 },

      // ── The Burger Hub ──
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhBurgers,
        name: 'Classic Veg Burger', description: 'Crispy veggie patty, lettuce, tomato, and our secret sauce.',
        price: 180, isVeg: true, isFeatured: false, prepTime: 10 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhBurgers,
        name: 'Smoky BBQ Chicken Burger', description: 'Grilled chicken fillet with smoky BBQ sauce and jalapeños.',
        price: 280, isVeg: false, isFeatured: true, prepTime: 12 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhBurgers,
        name: 'Double Smash Burger', description: 'Double smash patties with American cheese, pickles, and mustard.',
        price: 380, isVeg: false, isFeatured: true, prepTime: 14 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhBurgers,
        name: 'Paneer Tikka Burger', description: 'Desi fusion — tandoori paneer in a toasted brioche bun.',
        price: 240, isVeg: true, isFeatured: true, prepTime: 12 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhSides,
        name: 'Loaded Cheese Fries', description: 'Crispy fries loaded with cheddar sauce and jalapeños.',
        price: 180, isVeg: true, isFeatured: false, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhSides,
        name: 'Onion Rings', description: 'Golden battered onion rings with ranch dip.',
        price: 140, isVeg: true, isFeatured: false, prepTime: 8 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhDrinks,
        name: 'Chocolate Thick Shake', description: 'Thick Belgian chocolate milkshake — dessert in a glass.',
        price: 160, isVeg: true, isFeatured: false, prepTime: 5 },
      { id: uuidv4(), restaurantId: restId.burgerHub, categoryId: catId.bhDrinks,
        name: 'Cold Coffee', description: 'Iced coffee blended with milk and a scoop of vanilla ice cream.',
        price: 140, isVeg: true, isFeatured: false, prepTime: 5 },

      // ── Biryani House ──
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhBiryani,
        name: 'Chicken Dum Biryani', description: 'Aromatic long-grain basmati with tender chicken, dum-cooked in a sealed handi.',
        price: 320, isVeg: false, isFeatured: true, prepTime: 40 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhBiryani,
        name: 'Mutton Biryani', description: 'Slow-cooked mutton pieces layered with fragrant saffron rice.',
        price: 420, isVeg: false, isFeatured: true, prepTime: 45 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhBiryani,
        name: 'Veg Dum Biryani', description: 'Mixed vegetables and paneer cooked with kewra-scented basmati.',
        price: 280, isVeg: true, isFeatured: true, prepTime: 35 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhBiryani,
        name: 'Egg Biryani', description: 'Hard-boiled eggs nestled in spiced biryani rice — a budget favourite.',
        price: 250, isVeg: false, isFeatured: false, prepTime: 30 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhGravy,
        name: 'Mirchi Ka Salan', description: 'Hyderabadi green chilli curry with tamarind and peanuts.',
        price: 120, isVeg: true, isFeatured: false, prepTime: 20 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhGravy,
        name: 'Shorba', description: 'Light, aromatic lamb stock broth — the classic biryani accompaniment.',
        price: 100, isVeg: false, isFeatured: false, prepTime: 15 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhRaita,
        name: 'Boondi Raita', description: 'Chilled yogurt with crispy boondi, cumin and coriander.',
        price: 80, isVeg: true, isFeatured: false, prepTime: 5 },
      { id: uuidv4(), restaurantId: restId.biryaniHouse, categoryId: catId.bhRaita,
        name: 'Mirchi & Onion Salad', description: 'Fresh sliced onions and green chillies with lemon and chaat masala.',
        price: 60, isVeg: true, isFeatured: false, prepTime: 5 },
    ];

    for (const item of foodItems) {
      await client.query(
        `INSERT INTO food_items
          (id, restaurant_id, category_id, name, description, price, is_veg, is_featured, prep_time_min)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [item.id, item.restaurantId, item.categoryId,
         item.name, item.description, item.price,
         item.isVeg, item.isFeatured, item.prepTime]
      );
    }
    console.log(`  ✅ ${foodItems.length} food items created`);

    // ─────────────────────────────────────────────────────────────
    // COUPONS
    // ─────────────────────────────────────────────────────────────
    console.log('🎫 Seeding coupons...');

    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    await client.query(
      `INSERT INTO coupons
        (id, code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active, expires_at)
       VALUES
        ($1, 'WELCOME50',   'Get 50% off on your first order',         'percentage', 50, 0,   150, 1000, true, $7),
        ($2, 'FLAT100',     'Flat ₹100 off on orders above ₹400',      'flat',       100, 400, NULL, 500, true, $7),
        ($3, 'NEWUSER200',  '₹200 off for new users (min order ₹500)', 'flat',       200, 500, NULL, 500, true, $7),
        ($4, 'WEEKEND30',   '30% off every weekend (max ₹120)',         'percentage', 30, 200, 120, NULL, true, $7),
        ($5, 'BIRYANI15',   '15% off on all biryani orders',            'percentage', 15, 150, 80,  NULL, true, $7),
        ($6, 'FREEDEL',     'Free delivery on orders above ₹300',       'flat',       35,  300, NULL, NULL, true, $7)`,
      [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), futureDate]
    );
    console.log('  ✅ 6 coupons created');

    // ─────────────────────────────────────────────────────────────
    // COMMIT
    // ─────────────────────────────────────────────────────────────
    await client.query('COMMIT');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('─'.repeat(50));
    console.log('Demo Accounts:');
    console.log('  Customer 1 : customer1@demo.com  / Demo@123');
    console.log('  Customer 2 : customer2@demo.com  / Demo@123');
    console.log('  Customer 3 : customer3@demo.com  / Demo@123');
    console.log('  Owner 1    : owner1@demo.com     / Demo@123');
    console.log('  Owner 2    : owner2@demo.com     / Demo@123');
    console.log('  Admin      : admin@demo.com       / Admin@123');
    console.log('─'.repeat(50));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed — rolled back all changes');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
