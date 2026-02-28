require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('whatsapp_lite');
  
  // Check messages with non-empty starredBy
  const msgs = await db.collection('messages').find({ 
    starredBy: { $exists: true, $not: { $size: 0 } } 
  }).toArray();
  console.log('Messages with non-empty starredBy:', msgs.length);
  msgs.forEach(m => console.log({
    _id: m._id, 
    from: m.fromUsername, 
    to: m.toUsername, 
    starredBy: m.starredBy
  }));
  
  // Check starred messages for priya specifically
  const priyaStarred = await db.collection('messages').find({ 
    starredBy: 'priya' 
  }).toArray();
  console.log('\nMessages starred by priya:', priyaStarred.length);
  
  await client.close();
})();
