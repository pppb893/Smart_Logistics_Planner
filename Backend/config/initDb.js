import pool from './db.js';

const initDb = async () => {
  let retries = 20;
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

      // Create Shipments Table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS shipments (
          id VARCHAR(36) PRIMARY KEY,
          user_id INT NOT NULL,
          truck VARCHAR(100) NOT NULL,
          origin VARCHAR(255) NOT NULL,
          destination VARCHAR(255) NOT NULL,
          distance DECIMAL(10,1),
          duration VARCHAR(20),
          color VARCHAR(20),
          is_safe BOOLEAN DEFAULT TRUE,
          visible BOOLEAN DEFAULT TRUE,
          route_geometry JSON,
          route_distance DOUBLE,
          route_duration DOUBLE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
