const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzaire')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all collections in the database
      const collections = await mongoose.connection.db.collections();
      
      if (collections.length === 0) {
        console.log('No collections found in the database.');
        return;
      }
      
      // Drop each collection
      for (const collection of collections) {
        try {
          await collection.drop();
          console.log(`Dropped collection: ${collection.collectionName}`);
        } catch (err) {
          // Handle system collections that cannot be dropped
          if (err.message.includes('ns not found') || err.message.includes('system.indexes') || 
              err.message.includes('system.users') || err.message.includes('system.version')) {
            console.log(`Skipping system collection: ${collection.collectionName}`);
          } else {
            console.error(`Error dropping collection ${collection.collectionName}:`, err);
          }
        }
      }
      
      console.log('Database clearing process completed!');
    } catch (error) {
      console.error('Error clearing database:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
