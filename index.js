import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { MongoClient } from "mongodb";
import joi from 'joi';
import dayjs from 'dayjs';
import bcrypt from "bcrypt";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("mywallet");
});

//joi scheemas

const signupSchema = joi.object({

    name: joi.string()
        .min(1)
        .required(),

    email: joi.string()
        .email()
        .required(),

    password: joi.string()
        .min(4)
        .max(8)
        .required()
})

//Rotas de Usuários
app.post("/signup", async (req, res) => {

    const { name, email, password } = req.body;

    const hashPassword = bcrypt.hashSync(password, 10);

    await db.collection('users').insertOne({ name: name, email: email, password: hashPassword })

});

app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });

    try {

        if(!user) {
            return res.status(404).send('Usuário ou senha incorretos');
        }
        if(!isValid) {
            return res.status(404).send('Usuário ou senha incorretos');
        }
    
        res.send(200);
    } catch (error) {
        console.error(error)
        return res.send(500)
    }
})

//Rotas de 
app.listen(5000, () => console.log("Listening on port 5000"));
