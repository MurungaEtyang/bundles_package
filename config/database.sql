CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    password TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a single offers table with a category field
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('data', 'sms', 'voice')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create an index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);

CREATE TABLE IF NOT EXISTS mpesa_credentials(
    id SERIAL PRIMARY KEY,
    consumer_key VARCHAR(100) NOT NULL,
    consumer_secret VARCHAR(100) NOT NULL,
    short_code VARCHAR(100) NOT NULL,
    pass_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store M-Pesa transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    merchant_request_id VARCHAR(255) NOT NULL,
    checkout_request_id VARCHAR(255) NOT NULL,
    result_code INT NOT NULL,
    result_desc VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mpesa_receipt_number VARCHAR(100),
    transaction_date TIMESTAMP,
    phone_number VARCHAR(20) NOT NULL,
    account_reference VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_request_id, checkout_request_id)
);

-- Index for faster lookups on common queries
CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(mpesa_receipt_number) WHERE mpesa_receipt_number IS NOT NULL;

