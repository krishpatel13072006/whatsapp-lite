db = db.getSiblingDB('whatsapp-clone');

db.users.deleteMany({ username: { $in: ['priya_pacnahl', 'angel_priya'] } });
db.messages.deleteMany({ fromUsername: { $in: ['priya_pacnahl', 'angel_priya'] } });
db.messages.deleteMany({ toUsername: { $in: ['priya_pacnahl', 'angel_priya'] } });
db.users.updateMany({}, { $pull: { friends: { $in: ['priya_pacnahl', 'angel_priya'] } } });

print("Cleanup complete.");
