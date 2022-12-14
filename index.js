import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { MongoClient } from "mongodb";
import joi from 'joi';
import dayjs from 'dayjs';
import bcrypt from "bcrypt";
import { v4 as uuid } from 'uuid';

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

    const joiValidate = signupSchema.validate(req.body);

    if(joiValidate) {
        res.send(422);
    }

    const { name, email, password } = req.body;

    const hashPassword = bcrypt.hashSync(password, 10);

    await db.collection('users').insertOne({ name: name, email: email, password: hashPassword })

});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });

    const passwordIsValid = bcrypt.compareSync(password, user.password)


    if(user && passwordIsValid) {
        const token = uuid();

		await db.collection("sessions").insertOne({
			userId: user._id,
			token
		});

        res.send(token);
    } else {
        res.send(404)
    }
});

//Rotas de Dados

app.post("/bill", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    const { value, description } = req.body;
    const date = dayjs().format('DD/MM');
    console.log(token);

    if (!token) return res.sendStatus(404);

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.sendStatus(401);
    }

    const user = await db.collection("users").findOne({ 
		_id: session.userId 
	});

    if(user) {

        await db.collection('records').insertOne({ 
            value,
            description,
            date,
            userId: user._id,
            type: "bill"
        });

        res.sendStatus(201);

    } else {
        res.sendStatus(401);
    }
});

app.post("/income")

app.get("/records", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    console.log("token: ",token)

    if (!token) return res.sendStatus(404);

    const session = await db.collection("sessions").findOne({ token });

    if (!session) {
        return res.sendStatus(401);
    }

    const user = await db.collection("users").findOne({ 
		_id: session.userId 
	});

    if(user) {

        const userRecords = await db.collection('records').find({userId: session.userId}).toArray();

        console.log("userRecords: ", userRecords.data);
        res.send(userRecords);

    } else {
        res.sendStatus(401);
    }

})

app.listen(5000, () => console.log("Listening on port 5000"));
