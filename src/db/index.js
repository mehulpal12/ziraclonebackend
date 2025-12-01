import mongoose from "mongoose";



const connetDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGODBURI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("mongoose error")
        process.exit(1);
    }
}

export default connetDB;