DROP TABLE IF EXISTS push_subscriptions;
CREATE TABLE push_subscriptions (
  endpoint VARCHAR(500) PRIMARY KEY,
  keys_p256dh VARCHAR(255) NOT NULL,
  keys_auth VARCHAR(255) NOT NULL,
  topics TEXT,
  user_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
