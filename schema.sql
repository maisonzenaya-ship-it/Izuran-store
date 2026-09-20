-- ==========================================
-- IZURAN
-- BASE DE DONNÉES E-COMMERCE
-- ==========================================


-- ==========================================
-- PRODUITS
-- ==========================================

CREATE TABLE IF NOT EXISTS products (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    slug TEXT NOT NULL UNIQUE,

    description TEXT NOT NULL DEFAULT '',

    category TEXT NOT NULL DEFAULT 'Mixte',

    price_cents INTEGER NOT NULL,

    image TEXT NOT NULL
        DEFAULT '/assets/product-placeholder.svg',

    stock INTEGER NOT NULL DEFAULT 0,

    active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- COMMANDES
-- ==========================================

CREATE TABLE IF NOT EXISTS orders (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_number TEXT NOT NULL UNIQUE,

    customer_name TEXT NOT NULL,

    customer_email TEXT NOT NULL,

    customer_phone TEXT NOT NULL DEFAULT '',

    fulfillment TEXT NOT NULL,

    pickup_date TEXT,

    pickup_time TEXT,

    total_cents INTEGER NOT NULL,

    payment_status TEXT NOT NULL
        DEFAULT 'pending',

    status TEXT NOT NULL
        DEFAULT 'received',

    created_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- ARTICLES DES COMMANDES
-- ==========================================

CREATE TABLE IF NOT EXISTS order_items (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    product_name TEXT NOT NULL,

    unit_price_cents INTEGER NOT NULL,

    quantity INTEGER NOT NULL,

    FOREIGN KEY (
        order_id
    )
    REFERENCES orders(id)

);


-- ==========================================
-- INDEX
-- ==========================================

CREATE INDEX IF NOT EXISTS
idx_products_category

ON products(category);


CREATE INDEX IF NOT EXISTS
idx_orders_number

ON orders(order_number);


-- ==========================================
-- PRODUITS DE DÉMONSTRATION
-- ==========================================

INSERT OR IGNORE INTO products (

    name,

    slug,

    description,

    category,

    price_cents,

    image,

    stock

)

VALUES (

    'Éclat Noir',

    'eclat-noir',

    'Une fragrance élégante aux notes profondes.',

    'Mixte',

    5900,

    '/assets/product-placeholder.svg',

    12

);


INSERT OR IGNORE INTO products (

    name,

    slug,

    description,

    category,

    price_cents,

    image,

    stock

)

VALUES (

    'Velours Blanc',

    'velours-blanc',

    'Une composition douce et lumineuse.',

    'Femme',

    6500,

    '/assets/product-placeholder.svg',

    8

);


INSERT OR IGNORE INTO products (

    name,

    slug,

    description,

    category,

    price_cents,

    image,

    stock

)

VALUES (

    'Noir Intense',

    'noir-intense',

    'Une fragrance intense au caractère affirmé.',

    'Homme',

    6900,

    '/assets/product-placeholder.svg',

    10

);