import pool from './db.js';

const initDb = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      
      // Create Users Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Database tables initialized successfully.');
      connection.release();
      break; // Exit loop on success
    } catch (error) {
      console.error(`❌ Failed to initialize database. Retrying in 3 seconds... (${retries} retries left)`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 3000)); // Wait 3 seconds
      if (retries === 0) {
        console.error('🚨 Could not initialize database after multiple attempts. Is MySQL running?');
      }
    }
  }
};

export default initDb;
