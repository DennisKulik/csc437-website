import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";
const credentialSchema = new Schema({
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
}, { collection: "user_credentials" });
const credentialModel = model("Credential", credentialSchema);
async function create(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new credentialModel({ username, hashedPassword }).save();
}
async function verify(username, password) {
    const credsOnFile = await credentialModel.findOne({ username });
    if (!credsOnFile)
        throw new Error("Invalid username or password");
    const verified = await bcrypt.compare(password, credsOnFile.hashedPassword);
    if (!verified)
        throw new Error("Invalid username or password");
    return credsOnFile.username;
}
function remove(username) {
    return credentialModel.findOneAndDelete({ username })
        .then((deleted) => Boolean(deleted));
}
export default { create, verify, remove };
