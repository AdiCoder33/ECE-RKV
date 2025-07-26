const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'college_management',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('Connected to MSSQL database');
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
    const request = poolConnection.request();
    
    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = { connectDB, executeQuery, sql };