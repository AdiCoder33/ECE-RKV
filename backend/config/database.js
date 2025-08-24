const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'college_management',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 600000
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
    request.requestTimeout = 60000;
    
    // Add parameters with explicit type handling for null or undefined values
    params.forEach((param, index) => {
      if (param === null || param === undefined) {
        // Default to NVARCHAR for null/undefined; adjust type as needed
        request.input(`param${index}`, sql.NVarChar, null);
      } else {
        request.input(`param${index}`, param);
      }
    });
    
    // Replace ? placeholders with @param syntax for MSSQL
    let mssqlQuery = query;
    params.forEach((_, index) => {
      mssqlQuery = mssqlQuery.replace('?', `@param${index}`);
    });
    
    const result = await request.query(mssqlQuery);
    return { recordset: result.recordset, rowsAffected: result.rowsAffected };
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = { connectDB, executeQuery, sql };
