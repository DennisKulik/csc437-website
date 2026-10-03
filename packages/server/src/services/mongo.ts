import mongoose from "mongoose";
import { config } from "../config.ts";

function getMongoURI(dbname: string): string {
    const username = encodeURIComponent(config.mongoUser);
    const password = encodeURIComponent(config.mongoPassword);
    return `mongodb+srv://${username}:${password}@${config.mongoCluster}/${dbname}?retryWrites=true&w=majority`;
}

export async function connect(dbname: string): Promise<void> {
    await mongoose.connect(getMongoURI(dbname));
    await Promise.all(
        Object.values(mongoose.models).map((registeredModel) => registeredModel.init())
    );
    console.log(`Connected to MongoDB database ${dbname}`);
}
