import { getDatabase } from './database.js';

const database = await getDatabase();
await database.close();
console.log('SQLite database initialized');
