#!/usr/bin/env node
/**
 * Generates realistic e-commerce CSV data for the Claude Code workshop.
 * Fictitious home goods retailer: "Haven & Hearth Home Goods"
 * 3 years of data: Jan 2023 – Dec 2025
 *
 * Run: node generate-data.mjs
 * Output: public/data/{customers,orders,products,ad_spend}.csv
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "public", "data");

/* ── Seeded PRNG (mulberry32) ─────────────────────────────────────────── */
let _seed = 42;
function rand() {
  let t = (_seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Reference Data ───────────────────────────────────────────────────── */

const FIRST_NAMES = [
  "Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","William",
  "Mia","James","Charlotte","Benjamin","Amelia","Lucas","Harper","Henry","Evelyn","Alexander",
  "Abigail","Michael","Emily","Daniel","Elizabeth","Jacob","Sofia","Logan","Avery","Jackson",
  "Ella","Sebastian","Scarlett","Aiden","Grace","Matthew","Chloe","Samuel","Victoria","David",
  "Riley","Joseph","Aria","Carter","Lily","Owen","Aubrey","Wyatt","Zoey","John",
  "Hannah","Jack","Nora","Luke","Lillian","Jayden","Addison","Dylan","Eleanor","Gabriel",
  "Natalie","Anthony","Luna","Isaac","Savannah","Lincoln","Brooklyn","Joshua","Leah","Andrew",
  "Zoe","Christopher","Stella","Theodore","Hazel","Caleb","Ellie","Ryan","Paisley","Nathan",
  "Audrey","Adrian","Skylar","Miles","Violet","Leo","Claire","Oscar","Bella","Adam",
  "Aurora","Cooper","Lucy","Ezra","Anna","Ian","Samantha","Carson","Caroline","Asher",
  "Kennedy","Jaxon","Maya","Elijah","Willow","Thomas","Kinsley","Charles","Naomi","Jordan",
  "Aaliyah","Hunter","Elena","Cameron","Sarah","Kai","Ariana","Aaron","Allison","Dominic",
  "Gabriella","Landon","Alice","Tyler","Madelyn","Austin","Cora","Colton","Ruby","Brayden",
  "Eva","Connor","Serenity","Robert","Autumn","Nicholas","Adeline","Eli","Hailey","Nolan",
  "Gianna","Parker","Valentina","Levi","Eliana","Blake","Quinn","Xavier","Nevaeh","Declan",
  "Ivy","Jeremiah","Sadie","Damian","Piper","Ryder","Lydia","Grayson","Alexa","Roman",
  "Josephine","Axel","Emery","Josiah","Julia","Micah","Delilah","Everett","Arianna","Wesley",
  "Vivian","Maxwell","Kaylee","Silas","Sophie","Brooks","Brielle","Bennett","Madeline","Harrison",
  "Peyton","Zachary","Rylee","Cole","Clara","Tristan","Melody","Grant","Iris","Finn","Lyric",
  "Patrick","Rose","Jasper","Aubree","Chase","Raelynn","Vincent","Lucia","Weston","Lila",
];

const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
  "Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes",
  "Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper",
  "Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson",
  "Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes",
  "Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez",
];

const CITIES_STATES = [
  // Store cities (weighted higher for in-store customers)
  ["New York","NY"],["Los Angeles","CA"],["Chicago","IL"],["Austin","TX"],
  ["Miami","FL"],["Portland","OR"],["Nashville","TN"],["Denver","CO"],
  // Online-only customer cities
  ["San Francisco","CA"],["Seattle","WA"],["Boston","MA"],["Philadelphia","PA"],
  ["Phoenix","AZ"],["San Diego","CA"],["Dallas","TX"],["Houston","TX"],
  ["Atlanta","GA"],["Minneapolis","MN"],["Detroit","MI"],["Charlotte","NC"],
  ["San Antonio","TX"],["Columbus","OH"],["Indianapolis","IN"],["Jacksonville","FL"],
  ["Fort Worth","TX"],["Memphis","TN"],["Baltimore","MD"],["Milwaukee","WI"],
  ["Albuquerque","NM"],["Tucson","AZ"],["Sacramento","CA"],["Kansas City","MO"],
  ["Raleigh","NC"],["Omaha","NE"],["Virginia Beach","VA"],["Oakland","CA"],
  ["Tampa","FL"],["Tulsa","OK"],["New Orleans","LA"],["Cleveland","OH"],
  ["Pittsburgh","PA"],["Cincinnati","OH"],["St. Louis","MO"],["Salt Lake City","UT"],
  ["Boise","ID"],["Richmond","VA"],["Spokane","WA"],["Des Moines","IA"],
];

const STORE_CITIES = ["New York","Los Angeles","Chicago","Austin","Miami","Portland","Nashville","Denver"];

const MEMBERSHIP_TIERS = ["none","silver","gold","platinum"];
const MEMBERSHIP_WEIGHTS = [60, 20, 13, 7];
const MEMBERSHIP_FEES = { none: 0, silver: 9.99, gold: 19.99, platinum: 39.99 };

const CHANNELS_ACQUIRED = ["organic_search","paid_search","social_media","referral","in_store","email","direct"];
const CHANNEL_WEIGHTS = [25, 20, 18, 12, 15, 5, 5];

/* ── Products & Services Catalog ──────────────────────────────────────── */

const PRODUCTS = [
  // Kitchen & Dining
  { name: "Cast Iron Skillet 12\"", category: "Kitchen & Dining", sub: "Cookware", price: 49.99, cost: 18.00 },
  { name: "Stainless Steel Pot Set (5pc)", category: "Kitchen & Dining", sub: "Cookware", price: 189.99, cost: 72.00 },
  { name: "Non-Stick Frying Pan", category: "Kitchen & Dining", sub: "Cookware", price: 34.99, cost: 12.00 },
  { name: "Ceramic Dinner Plate Set (4)", category: "Kitchen & Dining", sub: "Dinnerware", price: 59.99, cost: 20.00 },
  { name: "Stoneware Bowl Set (6)", category: "Kitchen & Dining", sub: "Dinnerware", price: 44.99, cost: 15.00 },
  { name: "Crystal Wine Glass Set (4)", category: "Kitchen & Dining", sub: "Glassware", price: 64.99, cost: 22.00 },
  { name: "Handblown Tumbler Set (6)", category: "Kitchen & Dining", sub: "Glassware", price: 54.99, cost: 19.00 },
  { name: "Bamboo Cutting Board", category: "Kitchen & Dining", sub: "Utensils", price: 29.99, cost: 9.00 },
  { name: "Chef Knife Set (3pc)", category: "Kitchen & Dining", sub: "Utensils", price: 129.99, cost: 45.00 },
  { name: "Wooden Serving Tray", category: "Kitchen & Dining", sub: "Utensils", price: 39.99, cost: 13.00 },
  { name: "Espresso Machine", category: "Kitchen & Dining", sub: "Appliances", price: 299.99, cost: 120.00 },
  { name: "Stand Mixer", category: "Kitchen & Dining", sub: "Appliances", price: 349.99, cost: 140.00 },

  // Bedding & Bath
  { name: "Egyptian Cotton Sheet Set (Queen)", category: "Bedding & Bath", sub: "Sheets", price: 129.99, cost: 42.00 },
  { name: "Linen Sheet Set (King)", category: "Bedding & Bath", sub: "Sheets", price: 179.99, cost: 60.00 },
  { name: "Microfiber Sheet Set (Full)", category: "Bedding & Bath", sub: "Sheets", price: 49.99, cost: 14.00 },
  { name: "Down Comforter (Queen)", category: "Bedding & Bath", sub: "Bedding", price: 199.99, cost: 70.00 },
  { name: "Weighted Blanket 15lb", category: "Bedding & Bath", sub: "Bedding", price: 89.99, cost: 32.00 },
  { name: "Memory Foam Pillow (2-pack)", category: "Bedding & Bath", sub: "Pillows", price: 69.99, cost: 22.00 },
  { name: "Turkish Cotton Bath Towel Set (4)", category: "Bedding & Bath", sub: "Towels", price: 79.99, cost: 26.00 },
  { name: "Waffle Weave Hand Towels (6)", category: "Bedding & Bath", sub: "Towels", price: 34.99, cost: 11.00 },
  { name: "Bamboo Bath Mat", category: "Bedding & Bath", sub: "Accessories", price: 44.99, cost: 15.00 },
  { name: "Ceramic Soap Dispenser Set", category: "Bedding & Bath", sub: "Accessories", price: 24.99, cost: 8.00 },

  // Furniture
  { name: "Mid-Century Dining Table", category: "Furniture", sub: "Tables", price: 599.99, cost: 220.00 },
  { name: "Farmhouse Coffee Table", category: "Furniture", sub: "Tables", price: 349.99, cost: 130.00 },
  { name: "Marble Side Table", category: "Furniture", sub: "Tables", price: 199.99, cost: 72.00 },
  { name: "Upholstered Dining Chair (2)", category: "Furniture", sub: "Chairs", price: 299.99, cost: 110.00 },
  { name: "Rattan Accent Chair", category: "Furniture", sub: "Chairs", price: 249.99, cost: 90.00 },
  { name: "Velvet Armchair", category: "Furniture", sub: "Chairs", price: 449.99, cost: 165.00 },
  { name: "Floating Wall Shelf Set (3)", category: "Furniture", sub: "Shelving", price: 79.99, cost: 28.00 },
  { name: "Bookcase 5-Tier", category: "Furniture", sub: "Shelving", price: 189.99, cost: 68.00 },
  { name: "Writing Desk", category: "Furniture", sub: "Desks", price: 279.99, cost: 100.00 },
  { name: "Standing Desk Converter", category: "Furniture", sub: "Desks", price: 199.99, cost: 75.00 },

  // Lighting
  { name: "Brass Table Lamp", category: "Lighting", sub: "Lamps", price: 89.99, cost: 32.00 },
  { name: "Ceramic Floor Lamp", category: "Lighting", sub: "Lamps", price: 149.99, cost: 52.00 },
  { name: "Rattan Pendant Light", category: "Lighting", sub: "Pendants", price: 119.99, cost: 42.00 },
  { name: "Industrial Chandelier", category: "Lighting", sub: "Pendants", price: 249.99, cost: 88.00 },
  { name: "Brass Wall Sconce (pair)", category: "Lighting", sub: "Sconces", price: 109.99, cost: 38.00 },
  { name: "Soy Candle Collection (3)", category: "Lighting", sub: "Candles", price: 39.99, cost: 12.00 },
  { name: "Beeswax Taper Candles (12)", category: "Lighting", sub: "Candles", price: 29.99, cost: 9.00 },
  { name: "LED String Lights", category: "Lighting", sub: "Accent", price: 19.99, cost: 6.00 },

  // Decor & Accessories
  { name: "Abstract Canvas Print (24x36)", category: "Decor", sub: "Wall Art", price: 89.99, cost: 28.00 },
  { name: "Gallery Frame Set (5)", category: "Decor", sub: "Wall Art", price: 49.99, cost: 16.00 },
  { name: "Oversized Wall Mirror", category: "Decor", sub: "Mirrors", price: 179.99, cost: 62.00 },
  { name: "Ceramic Vase Collection (3)", category: "Decor", sub: "Vases", price: 59.99, cost: 20.00 },
  { name: "Dried Floral Arrangement", category: "Decor", sub: "Vases", price: 44.99, cost: 14.00 },
  { name: "Hand-Woven Area Rug 5x7", category: "Decor", sub: "Rugs", price: 249.99, cost: 88.00 },
  { name: "Jute Runner 2x8", category: "Decor", sub: "Rugs", price: 79.99, cost: 28.00 },
  { name: "Throw Pillow Set (2)", category: "Decor", sub: "Textiles", price: 44.99, cost: 14.00 },
  { name: "Chunky Knit Throw Blanket", category: "Decor", sub: "Textiles", price: 69.99, cost: 24.00 },
  { name: "Decorative Bookends (pair)", category: "Decor", sub: "Accents", price: 34.99, cost: 11.00 },

  // Outdoor & Garden
  { name: "Teak Outdoor Dining Set (5pc)", category: "Outdoor & Garden", sub: "Furniture", price: 899.99, cost: 340.00 },
  { name: "Wicker Patio Lounge Chair", category: "Outdoor & Garden", sub: "Furniture", price: 349.99, cost: 130.00 },
  { name: "Outdoor Umbrella 9ft", category: "Outdoor & Garden", sub: "Furniture", price: 129.99, cost: 45.00 },
  { name: "Ceramic Planter Large", category: "Outdoor & Garden", sub: "Planters", price: 59.99, cost: 20.00 },
  { name: "Hanging Planter Set (3)", category: "Outdoor & Garden", sub: "Planters", price: 44.99, cost: 15.00 },
  { name: "Self-Watering Herb Garden", category: "Outdoor & Garden", sub: "Planters", price: 39.99, cost: 13.00 },
  { name: "Premium Garden Tool Set", category: "Outdoor & Garden", sub: "Tools", price: 69.99, cost: 24.00 },
  { name: "Copper Watering Can", category: "Outdoor & Garden", sub: "Tools", price: 49.99, cost: 17.00 },

  // Storage & Organization
  { name: "Woven Storage Basket Set (4)", category: "Storage", sub: "Baskets", price: 54.99, cost: 18.00 },
  { name: "Seagrass Basket Large", category: "Storage", sub: "Baskets", price: 39.99, cost: 13.00 },
  { name: "Modular Closet System", category: "Storage", sub: "Closet", price: 299.99, cost: 110.00 },
  { name: "Velvet Hangers (50-pack)", category: "Storage", sub: "Closet", price: 29.99, cost: 9.00 },
  { name: "Kitchen Drawer Organizer Set", category: "Storage", sub: "Organizers", price: 34.99, cost: 11.00 },
  { name: "Stackable Pantry Bins (6)", category: "Storage", sub: "Organizers", price: 44.99, cost: 15.00 },
  { name: "Entryway Coat Rack", category: "Storage", sub: "Shelving", price: 89.99, cost: 32.00 },
  { name: "Bathroom Shelf Unit", category: "Storage", sub: "Shelving", price: 69.99, cost: 24.00 },
];

const SERVICES = [
  { name: "Interior Design Consultation (1hr)", category: "Services", sub: "Design", price: 175.00, cost: 60.00 },
  { name: "Interior Design Consultation (2hr)", category: "Services", sub: "Design", price: 299.00, cost: 100.00 },
  { name: "Full Room Design Package", category: "Services", sub: "Design", price: 499.00, cost: 170.00 },
  { name: "Home Staging — Living Room", category: "Services", sub: "Staging", price: 450.00, cost: 150.00 },
  { name: "Home Staging — Full Home", category: "Services", sub: "Staging", price: 1200.00, cost: 400.00 },
  { name: "Personal Shopping Session", category: "Services", sub: "Shopping", price: 150.00, cost: 50.00 },
  { name: "Delivery & Assembly — Standard", category: "Services", sub: "Delivery", price: 79.00, cost: 35.00 },
  { name: "Delivery & Assembly — Premium", category: "Services", sub: "Delivery", price: 149.00, cost: 60.00 },
  { name: "Gift Registry Planning", category: "Services", sub: "Registry", price: 99.00, cost: 30.00 },
  { name: "Seasonal Decor Refresh", category: "Services", sub: "Design", price: 250.00, cost: 85.00 },
];

const ALL_ITEMS = [
  ...PRODUCTS.map((p, i) => ({ ...p, id: `P${String(i + 1).padStart(3, "0")}`, type: "product" })),
  ...SERVICES.map((s, i) => ({ ...s, id: `S${String(i + 1).padStart(3, "0")}`, type: "service" })),
];

/* ── Category weights (probability of being ordered) ──────────────────── */
const CATEGORY_WEIGHTS = {
  "Kitchen & Dining": 25,
  "Bedding & Bath": 20,
  "Furniture": 12,
  "Lighting": 10,
  "Decor": 15,
  "Outdoor & Garden": 8,
  "Storage": 10,
  "Services": 8,
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function randomDate(start, end) {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + rand() * (e - s));
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields) {
  return fields.map(csvEscape).join(",");
}

/* ── Seasonality multiplier ───────────────────────────────────────────── */
function seasonMultiplier(month) {
  // month is 0-indexed (Jan=0)
  const multipliers = [
    0.80, // Jan — post-holiday slump
    0.75, // Feb
    0.90, // Mar — spring refresh starts
    1.05, // Apr
    1.10, // May — spring peak
    1.00, // Jun
    0.90, // Jul
    0.85, // Aug
    0.95, // Sep — fall refresh
    1.10, // Oct
    1.35, // Nov — Black Friday / holiday
    1.50, // Dec — peak holiday
  ];
  return multipliers[month];
}

/* Outdoor seasonality — boost in spring/summer */
function outdoorMultiplier(month) {
  const m = [0.3, 0.4, 0.8, 1.2, 1.5, 1.6, 1.5, 1.3, 1.0, 0.6, 0.3, 0.2];
  return m[month];
}

/* ── 1. GENERATE PRODUCTS CSV ─────────────────────────────────────────── */
console.log("Generating products.csv ...");

const productRows = [
  csvRow(["product_id","name","category","subcategory","type","retail_price","cost","margin_pct"]),
];

for (const item of ALL_ITEMS) {
  const margin = Math.round(((item.price - item.cost) / item.price) * 100);
  productRows.push(csvRow([
    item.id, item.name, item.category, item.sub, item.type,
    item.price.toFixed(2), item.cost.toFixed(2), margin,
  ]));
}

writeFileSync(join(DATA_DIR, "products.csv"), productRows.join("\n") + "\n");
console.log(`  → ${ALL_ITEMS.length} products/services`);

/* ── 2. GENERATE CUSTOMERS CSV ────────────────────────────────────────── */
console.log("Generating customers.csv ...");

const NUM_CUSTOMERS = 2000;
const START_DATE = new Date("2023-01-01");
const END_DATE = new Date("2025-12-31");

const customers = [];

for (let i = 0; i < NUM_CUSTOMERS; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const isStoreCity = rand() < 0.4;
  let finalCity, finalState;
  if (isStoreCity) {
    const sc = pick(STORE_CITIES);
    const match = CITIES_STATES.find(c => c[0] === sc);
    finalCity = sc;
    finalState = match ? match[1] : "NY";
  } else {
    const cityState = pick(CITIES_STATES);
    finalCity = cityState[0];
    finalState = cityState[1];
  }

  const signupDate = randomDate(START_DATE, END_DATE);
  const tier = weightedPick(MEMBERSHIP_TIERS, MEMBERSHIP_WEIGHTS);
  const channelAcquired = weightedPick(CHANNELS_ACQUIRED, CHANNEL_WEIGHTS);

  customers.push({
    id: `C${String(i + 1).padStart(4, "0")}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1, 999)}@${pick(["gmail.com","yahoo.com","outlook.com","icloud.com","hotmail.com","protonmail.com"])}`,
    city: finalCity,
    state: finalState,
    country: "US",
    signup_date: formatDate(signupDate),
    channel_acquired: channelAcquired,
    membership_tier: tier,
    membership_fee: MEMBERSHIP_FEES[tier].toFixed(2),
    // ltv, total_orders, total_products, total_services will be calculated after orders
    _signupTs: signupDate.getTime(),
    ltv: 0,
    total_orders: 0,
    total_products_bought: 0,
    total_services_purchased: 0,
  });
}

/* ── 3. GENERATE ORDERS CSV ───────────────────────────────────────────── */
console.log("Generating orders.csv ...");

const orderRows = [
  csvRow(["order_id","customer_id","order_date","channel","store_city","product_id","product_name","category","product_type","quantity","unit_price","line_total","discount_pct"]),
];

let orderIdCounter = 10001;
let totalLineItems = 0;

// Generate orders month by month for realistic distribution
for (let year = 2023; year <= 2025; year++) {
  for (let month = 0; month < 12; month++) {
    // Base orders per month, growing each year
    const yearGrowth = 1 + (year - 2023) * 0.18;
    const baseOrdersPerMonth = 180;
    const monthOrders = Math.round(baseOrdersPerMonth * yearGrowth * seasonMultiplier(month) * (0.9 + rand() * 0.2));

    for (let o = 0; o < monthOrders; o++) {
      const orderId = `ORD-${orderIdCounter++}`;

      // Pick a customer who signed up before this order date
      const orderDate = new Date(year, month, randInt(1, 28));
      const eligibleCustomers = customers.filter(c => c._signupTs <= orderDate.getTime());
      if (eligibleCustomers.length === 0) continue;

      // Bias toward more active customers (earlier signups have more orders)
      const customer = pick(eligibleCustomers);

      // Online vs in-store (online growing over time)
      const onlineRate = 0.40 + (year - 2023) * 0.10 + month * 0.002;
      const isOnline = rand() < onlineRate;
      const channel = isOnline ? "online" : "in-store";
      const storeCity = isOnline ? "" : pick(STORE_CITIES);

      // Number of line items (1-5, weighted toward 1-2)
      const numItems = weightedPick([1, 2, 3, 4, 5], [35, 30, 20, 10, 5]);

      // Pick items with category weighting
      const categories = Object.keys(CATEGORY_WEIGHTS);
      const catWeights = Object.values(CATEGORY_WEIGHTS);

      // Discount: 0%, 5%, 10%, 15%, 20% — members get discounts more often
      const memberDiscount = customer.membership_tier === "platinum" ? 15
        : customer.membership_tier === "gold" ? 10
        : customer.membership_tier === "silver" ? 5 : 0;
      const hasDiscount = rand() < (customer.membership_tier === "none" ? 0.15 : 0.40);
      const discountPct = hasDiscount ? Math.max(memberDiscount, weightedPick([5, 10, 15, 20], [40, 30, 20, 10])) : 0;

      for (let li = 0; li < numItems; li++) {
        // Pick category, then pick product from that category
        let cat = weightedPick(categories, catWeights);

        // Outdoor boost in summer
        if (cat === "Outdoor & Garden" && outdoorMultiplier(month) < 0.5 && rand() < 0.7) {
          cat = weightedPick(categories, catWeights); // re-pick
        }

        const catItems = ALL_ITEMS.filter(item => {
          if (cat === "Services") return item.type === "service";
          return item.category === cat;
        });
        if (catItems.length === 0) continue;

        const item = pick(catItems);
        const quantity = item.type === "service" ? 1 : weightedPick([1, 2, 3], [70, 25, 5]);
        const lineTotal = +(item.price * quantity * (1 - discountPct / 100)).toFixed(2);

        orderRows.push(csvRow([
          orderId, customer.id, formatDate(orderDate), channel, storeCity,
          item.id, item.name, item.category, item.type,
          quantity, item.price.toFixed(2), lineTotal.toFixed(2), discountPct,
        ]));

        // Update customer aggregates
        customer.ltv += lineTotal;
        customer.total_orders = (customer._orderIds || new Set()).add(orderId).size;
        customer._orderIds = (customer._orderIds || new Set()).add(orderId);
        if (item.type === "product") {
          customer.total_products_bought += quantity;
        } else {
          customer.total_services_purchased += quantity;
        }

        totalLineItems++;
      }
    }
  }
}

// Finalize customer order counts
for (const c of customers) {
  c.total_orders = c._orderIds ? c._orderIds.size : 0;
}

// Write customers CSV
const customerRows = [
  csvRow(["customer_id","name","email","city","state","country","signup_date","channel_acquired","membership_tier","membership_fee","ltv","total_orders","total_products_bought","total_services_purchased"]),
];

for (const c of customers) {
  customerRows.push(csvRow([
    c.id, c.name, c.email, c.city, c.state, c.country,
    c.signup_date, c.channel_acquired, c.membership_tier, c.membership_fee,
    c.ltv.toFixed(2), c.total_orders, c.total_products_bought, c.total_services_purchased,
  ]));
}

writeFileSync(join(DATA_DIR, "customers.csv"), customerRows.join("\n") + "\n");
console.log(`  → ${NUM_CUSTOMERS} customers`);

writeFileSync(join(DATA_DIR, "orders.csv"), orderRows.join("\n") + "\n");
console.log(`  → ${totalLineItems} order line items`);

/* ── 4. GENERATE AD SPEND CSV ─────────────────────────────────────────── */
console.log("Generating ad_spend.csv ...");

const AD_CHANNELS = ["Google Ads","Meta Ads","TikTok Ads","Email Marketing","Direct Mail"];

const adRows = [
  csvRow(["month","channel","spend","impressions","clicks","conversions","revenue_attributed"]),
];

for (let year = 2023; year <= 2025; year++) {
  for (let month = 0; month < 12; month++) {
    const yearGrowth = 1 + (year - 2023) * 0.20;
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const seasonal = seasonMultiplier(month);

    for (const channel of AD_CHANNELS) {
      let baseSpend, cpm, ctr, convRate, roas;

      switch (channel) {
        case "Google Ads":
          baseSpend = 12000;
          cpm = 28; ctr = 0.035; convRate = 0.04; roas = 5.2;
          break;
        case "Meta Ads":
          baseSpend = 9000;
          cpm = 18; ctr = 0.012; convRate = 0.025; roas = 3.8;
          break;
        case "TikTok Ads":
          // TikTok grows dramatically over the 3 years
          baseSpend = 1500 + (year - 2023) * 3000;
          cpm = 12; ctr = 0.008; convRate = 0.015; roas = 2.5 + (year - 2023) * 0.5;
          break;
        case "Email Marketing":
          baseSpend = 2000;
          cpm = 5; ctr = 0.025; convRate = 0.06; roas = 9.0;
          break;
        case "Direct Mail":
          baseSpend = 4000;
          cpm = 45; ctr = 0.015; convRate = 0.03; roas = 3.2;
          break;
      }

      const spend = +(baseSpend * yearGrowth * seasonal * (0.85 + rand() * 0.3)).toFixed(2);
      const impressions = Math.round(spend / cpm * 1000 * (0.9 + rand() * 0.2));
      const clicks = Math.round(impressions * ctr * (0.8 + rand() * 0.4));
      const conversions = Math.round(clicks * convRate * (0.7 + rand() * 0.6));
      const revenue = +(spend * roas * (0.8 + rand() * 0.4)).toFixed(2);

      adRows.push(csvRow([monthStr, channel, spend, impressions, clicks, conversions, revenue]));
    }
  }
}

writeFileSync(join(DATA_DIR, "ad_spend.csv"), adRows.join("\n") + "\n");
console.log(`  → ${adRows.length - 1} ad spend rows`);

console.log("\nDone! Files written to public/data/");
