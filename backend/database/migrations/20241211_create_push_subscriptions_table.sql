DROP TABLE IF EXISTS push_subscriptions;
CREATE TABLE push_subscriptions (
  endpoint NVARCHAR(500) PRIMARY KEY,
  keys_p256dh NVARCHAR(255) NOT NULL,
  keys_auth NVARCHAR(255) NOT NULL,
  topics NVARCHAR(MAX),
  user_id INT NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO
