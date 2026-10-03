import { Schema, model } from "mongoose";
const userProfileSchema = new Schema({
    userid: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    bio: { type: String, required: false, maxlength: 1000 },
    profilePicture: { type: String, required: false, maxlength: 2048 }
}, { collection: "users" });
const UserProfileModel = model("UserProfile", userProfileSchema);
function get(userid) {
    return UserProfileModel.findOne({ userid })
        .then((profile) => profile ?? undefined);
}
function create(json) {
    const profile = new UserProfileModel(json);
    return profile.save();
}
function update(userid, profile) {
    return UserProfileModel.findOneAndUpdate({ userid }, profile, { new: true }).then((updated) => updated ?? undefined);
}
export default { get, create, update };
