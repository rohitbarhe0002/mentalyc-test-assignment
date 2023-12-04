import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import bodyParser from 'body-parser';
import 'dotenv/config'
import authRoutes from './routes/authRoutes'; 
import taskRoutes from './routes/TaskRoutes'
import userRoutes from './routes/userRoutes'; 
import orderRoutes from './routes/orderRoutes'
import retaurentMenuRoutes from './routes/restaurentMenuRoutes'

const app = express();
const port =    3002;


//middlewares  used for session configuration
app.use(bodyParser.json()); 
app.use(session({
    secret: process.env.MY_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
      },
  }));
app.use(express.json());

app.use('/auth', authRoutes); 
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes); 
app.use('/order',  orderRoutes); 
app.use('/menu', retaurentMenuRoutes); 



mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as mongoose.ConnectOptions).then(() => {
    console.log("task managment DB is connected");
}).catch((e) => {
    console.log("no connection with task managment DB");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


export default app;