import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
import {notFound , errorHandler} from './middleware/errHand.js'
import pokeSrc from './routes/pokesrc.js'
import reports from './routes/reports.js'
import teamRout from './routes/team.js'
import teamMemRout from './routes/teamMembers.js'
import trainRout from './routes/trainer.js'
import battlesRout from './routes/battles.js'
import lookupsRout from './routes/lookups.js'
import constraintsRouter from './routes/constraints.js';
import viewsRouter from './routes/views.js';


dotenv.config();

const app = express();
app.use(cors()); 

app.use(express.json());


app.use('/api/pokemon' , pokeSrc)
app.use('/api/reports' , reports )
app.use('/api/trainers', trainRout);
app.use('/api/teams', teamRout);
app.use('/api/team-members', teamMemRout);
app.use('/api/battles', battlesRout);
app.use('/api', lookupsRout); 
app.use('/api/constraints', constraintsRouter);
app.use('/api/views', viewsRouter);

app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});