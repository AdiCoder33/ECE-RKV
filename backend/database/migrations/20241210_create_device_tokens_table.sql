CREATE TABLE device_tokens (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  token NVARCHAR(255) NOT NULL UNIQUE,
  platform NVARCHAR(50),
  created_at DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO
