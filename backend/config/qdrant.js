const { QdrantClient } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');
const { getEnv } = require('../utils/envValidator');

// Initialize Qdrant client
const qdrantUrl = getEnv('QDRANT_URL', 'Qdrant server URL');
if (!qdrantUrl) {
  logger.error('QDRANT_URL is required for Qdrant connection');
}
const qdrantClientUrl = qdrantUrl ? qdrantUrl : 'http://localhost:6333';
const qdrant = new QdrantClient({
  url: qdrantClientUrl,
});

// Verify collection exists
async function verifyCollection(collectionName) {
  try {
    const collections = await qdrant.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === collectionName
    );
    
    if (collectionExists) {
      logger.info(`Qdrant collection '${collectionName}' exists`);
      return true;
    } else {
      logger.warn(`Qdrant collection '${collectionName}' does not exist`);
      return false;
    }
  } catch (error) {
    logger.error('Error verifying Qdrant collection:', error);
    return false;
  }
}

// Test Qdrant connection
async function testConnection() {
  try {
    const collections = await qdrant.getCollections();
    logger.info('Qdrant connection established successfully', {
      collectionsCount: collections.collections.length,
    });
    return true;
  } catch (error) {
    logger.error('Qdrant connection failed:', error);
    return false;
  }
}

// Get collection name from environment
function getCollectionName() {
  const collectionName = getEnv('QDRANT_COLLECTION', 'Qdrant collection name');
  if (!collectionName) {
    logger.error('QDRANT_COLLECTION is required');
  }
  return collectionName ? collectionName : 'question_bank_all';
}

module.exports = {
  qdrant,
  verifyCollection,
  testConnection,
  getCollectionName,
};

