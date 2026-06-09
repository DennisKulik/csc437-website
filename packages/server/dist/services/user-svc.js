import { Schema, model } from "mongoose";
const userProfileSchema = new Schema({
    userid: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    bio: { type: String, required: false },
    profilePicture: { type: String, required: false }
}, { collection: "users" });
const UserProfileModel = model("UserProfile", userProfileSchema);
function index() {
    return UserProfileModel.find();
}
function get(userid) {
    return UserProfileModel.find({ userid })
        .then((list) => list[0])
        .catch(() => {
        throw `${userid} Not Found`;
    });
}
function create(json) {
    const profile = new UserProfileModel(json);
    return profile.save();
}
function update(userid, profile) {
    return UserProfileModel.findOneAndUpdate({ userid }, profile, { new: true }).then((updated) => {
        if (!updated)
            throw `${userid} not updated`;
        else
            return updated;
    });
}
function remove(userid) {
    return UserProfileModel.findOneAndDelete({ userid })
        .then((deleted) => {
        if (!deleted)
            throw `${userid} not deleted`;
    });
}
export default { index, get, create, update, remove };
