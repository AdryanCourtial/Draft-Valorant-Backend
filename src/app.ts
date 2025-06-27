import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';
import agentRouter from './routes/agentRoute';
import mapRouter from './routes/mapRoute';
import roleRouter from './routes/roleRoute';
import userRouter from './routes/userRoute';
import authRouter from './routes/authRoute';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import { draftSocketHandler } from './sockets/draft.socket';



dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  }
});

app.use(express.json());
app.use(cookieParser());


app.use(cors({
    origin: process.env.FRONT_URL,
    credentials: true, 
}));

io.on("connection", (socket) => {
  draftSocketHandler(io, socket);
});
  
const mainRouter = express.Router();

mainRouter.use('/agent', agentRouter);
mainRouter.use('/map', mapRouter);
mainRouter.use('/role', roleRouter);
mainRouter.use('/user', userRouter);
mainRouter.use('/auth', authRouter);
mainRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api', mainRouter);
  

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
