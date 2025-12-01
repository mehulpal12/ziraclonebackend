import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],

}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"}));
app.use(express.static("public"));

app.get("/" , (req,res) => {
    res.send("API is running...");
})
app.get("/hello" , (req,res) => {
    res.send("Hello World!");
})

import healthcheckRoutes from "./routes/healthcheck.routes.js";

app.use("/api/v1/healthcheck", healthcheckRoutes);


export default app;
