CREATE TABLE conversation_users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  conversation_type NVARCHAR(10) NOT NULL CHECK (conversation_type IN ('direct','group')),
  conversation_id INT NOT NULL,
  pinned BIT DEFAULT 0,
  last_read_at DATETIME2 DEFAULT '1900-01-01',
  CONSTRAINT fk_conversation_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, conversation_type, conversation_id)
);
GO
