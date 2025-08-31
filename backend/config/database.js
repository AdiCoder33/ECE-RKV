const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'college_management',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool(dbConfig);
      console.log('Connected to MySQL database');
    }
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const executeQuery = async (query, params = []) => {
  try {
    const poolConnection = await connectDB();
    const [rows, fields] = await poolConnection.execute(query, params);
    return [rows, fields];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = { connectDB, executeQuery };
