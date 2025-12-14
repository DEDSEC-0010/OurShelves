import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../../ourshelves.db'));

export function initializeDatabase() {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Users table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      default_latitude REAL,
      default_longitude REAL,
      default_address TEXT,
      avg_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      completed_transactions INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'banned')),
      strikes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Books table
    db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      cover_url TEXT,
      description TEXT,
      page_count INTEGER,
      condition TEXT CHECK(condition IN ('New', 'Good', 'Acceptable')),
      listing_type TEXT CHECK(listing_type IN ('Lend', 'Exchange', 'Both')) DEFAULT 'Lend',
      status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'PendingPickup', 'InTransit', 'Unavailable')),
      latitude REAL,
      longitude REAL,
      geohash TEXT,
      lending_duration_days INTEGER DEFAULT 14,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Create index on geohash for efficient geospatial queries
    db.exec(`CREATE INDEX IF NOT EXISTS idx_books_geohash ON books(geohash)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_id)`);

    // Transactions table
    db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id),
      owner_id INTEGER NOT NULL REFERENCES users(id),
      borrower_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK(status IN ('Requested', 'Approved', 'Rejected', 'PickedUp', 'Overdue', 'Completed', 'Disputed', 'Cancelled')),
      rejection_reason TEXT,
      pickup_confirmed_owner INTEGER DEFAULT 0,
      pickup_confirmed_borrower INTEGER DEFAULT 0,
      return_confirmed INTEGER DEFAULT 0,
      due_date DATETIME,
      picked_up_at DATETIME,
      returned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_borrower ON transactions(borrower_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_id)`);

    // Ratings table
    db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      rater_id INTEGER NOT NULL REFERENCES users(id),
      rated_id INTEGER NOT NULL REFERENCES users(id),
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      timeliness INTEGER CHECK(timeliness >= 1 AND timeliness <= 5),
      condition_accuracy INTEGER CHECK(condition_accuracy >= 1 AND condition_accuracy <= 5),
      communication INTEGER CHECK(communication >= 1 AND communication <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(transaction_id, rater_id)
    )
  `);

    // Messages table for in-app chat
    db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'status_update')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_transaction ON messages(transaction_id)`);

    // Disputes table
    db.exec(`
    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      reported_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      description TEXT,
      evidence_urls TEXT,
      status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'UnderReview', 'Resolved', 'Closed')),
      resolution TEXT,
      resolved_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )
  `);

    console.log('📦 Database initialized successfully');
}

export default db;
