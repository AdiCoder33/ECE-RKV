CREATE TABLE conversation_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  conversation_type ENUM('direct','group') NOT NULL,
  conversation_id INT NOT NULL,
  pinned BOOLEAN DEFAULT 0,
  last_read_at DATETIME DEFAULT '1900-01-01 00:00:00',
  CONSTRAINT fk_conversation_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conversation_users (user_id, conversation_type, conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
