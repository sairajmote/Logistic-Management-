-- ============================================
-- Commodity Management System
-- Database Schema
-- ============================================

-- 1. Suppliers
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    country VARCHAR NOT NULL
);


-- 2. Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL
);


-- 3. Shipments
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    quantity INTEGER NOT NULL,
    origin VARCHAR NOT NULL,
    destination VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    product_id INTEGER,
    supplier_id INTEGER,

    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
);


-- 4. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    supplier_id INTEGER,

    CONSTRAINT fk_users_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
);