# Haven & Hearth Home Goods — Data Reference

This project contains 3 years of e-commerce data (Jan 2023 – Dec 2025) for a fictitious home goods retailer that sells products and services through both online and 8 brick-and-mortar store locations.

The CSV data files are in `public/data/` and are served statically by Vite at `/data/*.csv`.

The project uses React + TypeScript + Vite. Recharts and PapaParse are already installed as dependencies.

## Data Files

### customers.csv (~2,000 rows)

| Column | Type | Description |
|--------|------|-------------|
| customer_id | string | Unique ID (C0001–C2000) |
| name | string | Full name |
| email | string | Email address |
| city | string | Customer's city |
| state | string | US state abbreviation |
| country | string | Always "US" |
| signup_date | date | YYYY-MM-DD |
| channel_acquired | string | How they found us: organic_search, paid_search, social_media, referral, in_store, email, direct |
| membership_tier | string | none, silver, gold, or platinum |
| membership_fee | number | Monthly fee: 0.00 / 9.99 / 19.99 / 39.99 |
| ltv | number | Lifetime value (total revenue from this customer) |
| total_orders | integer | Number of distinct orders |
| total_products_bought | integer | Total product units purchased |
| total_services_purchased | integer | Total service units purchased |

### orders.csv (~17,000 rows)

Each row is a **line item** — one order with 3 products appears as 3 rows sharing the same order_id.

| Column | Type | Description |
|--------|------|-------------|
| order_id | string | Order ID (ORD-10001+) |
| customer_id | string | Foreign key to customers.csv |
| order_date | date | YYYY-MM-DD |
| channel | string | "online" or "in-store" |
| store_city | string | Store city if in-store, empty if online |
| product_id | string | Foreign key to products.csv |
| product_name | string | Product/service name |
| category | string | Product category |
| product_type | string | "product" or "service" |
| quantity | integer | Units purchased |
| unit_price | number | Price per unit |
| line_total | number | quantity * unit_price * (1 - discount) |
| discount_pct | integer | Discount percentage applied (0, 5, 10, 15, or 20) |

### products.csv (76 rows)

| Column | Type | Description |
|--------|------|-------------|
| product_id | string | Unique ID (P001–P066 for products, S001–S010 for services) |
| name | string | Product/service name |
| category | string | Kitchen & Dining, Bedding & Bath, Furniture, Lighting, Decor, Outdoor & Garden, Storage, or Services |
| subcategory | string | More specific grouping within category |
| type | string | "product" or "service" |
| retail_price | number | Listed price |
| cost | number | Cost to the business |
| margin_pct | integer | Gross margin percentage |

### ad_spend.csv (180 rows)

Monthly advertising spend across 5 channels, 36 months.

| Column | Type | Description |
|--------|------|-------------|
| month | string | YYYY-MM format |
| channel | string | Google Ads, Meta Ads, TikTok Ads, Email Marketing, Direct Mail |
| spend | number | Total spend for that month/channel |
| impressions | integer | Ad impressions |
| clicks | integer | Ad clicks |
| conversions | integer | Attributed conversions |
| revenue_attributed | number | Revenue attributed to that channel |

## Store Locations

8 brick-and-mortar stores: New York, Los Angeles, Chicago, Austin, Miami, Portland, Nashville, Denver.

## Key Patterns in the Data

- **Seasonality**: Q4 (Nov/Dec) is peak; January is the slowest month
- **Year-over-year growth**: ~18% revenue growth per year
- **Channel shift**: Online orders grew from ~40% to ~60% over 3 years
- **Membership tiers**: ~60% free, ~20% silver, ~13% gold, ~7% platinum
- **TikTok Ads**: Fastest-growing ad channel (spend tripled over 3 years)
- **Email Marketing**: Highest ROAS of any channel
- **Outdoor & Garden**: Strong summer seasonality
