import express from 'express';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from 'cookie-parser';
import passport from 'passport';

import connectToDB from "./config/configServer.js"
import {__dirname} from "./utils.js"
import initializePassword from './config/passport.config.js';

//routes
import routerP from './routers/products.router.js';
import routerC from './routers/carts.router.js';
import routerV from './routers/views.router.js';
import userRouter from './routers/user.router.js';

//socket.io
import socketProducts from "./listeners/socketProducts.js"
import socketChat from './listeners/socketChat.js';


const app = express();
const PORT = process.env.PORT || 8080

app.use(express.static(__dirname+"/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//estructura de handlebars
app.engine("handlebars",handlebars.engine())
app.set('view engine', 'handlebars');
app.set("views",__dirname+"/views")


connectToDB()

const httpServer=app.listen(PORT,()=>{
    console.log(`server escuchandoooo en ${PORT}`)
})


//session login//
app.use(
    session({
        store: MongoStore.create({
            mongoUrl: "mongodb+srv://KatiaV:123@cluster0.y9v3q8o.mongodb.net/Ecommerce",
            mongoOptions:{
            useNewUrlParser: true,
            useUnifiedTopology: true},
            ttl: 15
        }),
        secret: "ClaveSecreta",
        resave: false,
        saveUninitialized: false,
    })
);

//Middleware passport
initializePassword();
app.use (passport.initialize());
app.use (passport.session());

//rutas
app.use('/api/products', routerP)
app.use('/api/carts', routerC)
app.use('/', routerV);
app.use('/api/sessions',userRouter)


//socket server
const socketServer = new Server(httpServer)
socketProducts(socketServer)
socketChat(socketServer)

//Products view y login session//

//Ingreso Products  http:localhost:8080/products

app.get("/products", async (req, res) => {
    if (!req.session.emailUsuario) 
    {
        return res.redirect("/login")
    }
    let allProducts  = await product.getProducts()
    allProducts = allProducts.map(product => product.toJSON());
    res.render("viewProducts", {
        title: "Vista Productos",
        products : allProducts,
        email: req.session.emailUsuario,
        rol: req.session.rolUsuario,
        algo: req.session.algo,
    });
})
app.get("/carts/:cid", async (req, res) => {
    let id = req.params.cid
    let allCarts  = await cart.getCartWithProducts(id)
    res.render("viewCart", {
        title: "Vista Carro",
        carts : allCarts
    });
})

//POST//

//Ingreso Login http://localhost:8080/login
app.post("/login", async (req, res) => {
const {email, passport}= req.body;
const emailTofind = email;
const user = await usersModel.findEmail ({email: emailTofind});

if (!user || user.password !== password){
    return res.stattus(401).jason ({message: " error al autentificar"})
}

const token = generateAndSetToken (Res,email,password);
res.json ({token,user:{email: user.email, rol: user.rol }});
  
});

app.post("/api/register",async(req,res)=>{
    const {first_name, last_name, email, age, password, rol}= req.body
    const emailTofind = email;
    const exists = await usersModel.findEmail ({email:emailTofind})
    if (exists) return res.status(400).send ({stattus:"error", error: "usuario ya existe"})
    const newUSer= {
first_name,last_name,email,age, password, cart:cart.addCart(), rol};
usersModel.addUser (newUser)
const token = generateAndSetToken (res,email,password)
res.send ({token})

})



//GET//

//Ingreso Register http://localhost:8080/register
app.get("/register", async (req, res) => { 
    res.render("register", {
        title: "Vista Register",
    });
})
//Ingreso Profile http://localhost:8080/profile
app.get("/profile", async (req, res) => { 
    if (!req.session.emailUsuario) 
    {
        return res.redirect("/login")
    }
    res.render("profile", {
        title: "Vista Profile Admin",
        first_name: req.session.nomUsuario,
        last_name: req.session.apeUsuario,
        email: req.session.emailUsuario,
        rol: req.session.rolUsuario,

    });
})

