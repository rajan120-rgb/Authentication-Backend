
const mongoose = require("mongoose");

async function mongoDbConnection() {

    // mongoose.connection.on("connected",()=> console.log("Database connected"))

    await mongoose.connect(`${process.env.MONGO_URL}/mern-auth`)
   
}

module.exports = mongoDbConnection;