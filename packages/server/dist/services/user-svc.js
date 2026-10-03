import { Schema, model } from "mongoose";
const userProfileSchema = new Schema({
    userid: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    bio: { type: String, required: false },
    profilePicture: { type: String, required: false }
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
function remove(userid) {
    return UserProfileModel.findOneAndDelete({ userid })
        .then((deleted) => Boolean(deleted));
}
export default { get, create, update, remove };
