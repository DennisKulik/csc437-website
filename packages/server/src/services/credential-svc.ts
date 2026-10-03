import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";
import { Credential } from "../models";

const credentialSchema = new Schema<Credential>(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        hashedPassword: {
            type: String,
            required: true
        }
    },
    { collection: "user_credentials" }
);

const credentialModel = model<Credential>(
    "Credential",
    credentialSchema
);

async function create(username: string, password: string): Promise<Credential> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new credentialModel({ username, hashedPassword }).save();
}

async function verify(username: string, password: string): Promise<string> {
    const credsOnFile = await credentialModel.findOne({ username });
    if (!credsOnFile) throw new Error("Invalid username or password");

    const verified = await bcrypt.compare(password, credsOnFile.hashedPassword);
    if (!verified) throw new Error("Invalid username or password");
    return credsOnFile.username;
}

function remove(username: string): Promise<boolean> {
    return credentialModel.findOneAndDelete({ username })
        .then((deleted) => Boolean(deleted));
}

export default { create, verify, remove };
