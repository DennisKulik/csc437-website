import { Schema, model } from "mongoose";
import { UserProfile } from "../models";

const userProfileSchema = new Schema(
    {
        userid: { type: String, required: true, unique: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        displayName: { type: String, required: true, trim: true, maxlength: 80 },
        bio: { type: String, required: false, maxlength: 1000 },
        profilePicture: { type: String, required: false, maxlength: 2048 }
    },
    { collection: "users" }
);

const UserProfileModel = model<UserProfile>(
    "UserProfile",
    userProfileSchema
);

function get(userid: string): Promise<UserProfile | undefined> {
    return UserProfileModel.findOne({ userid })
        .then((profile) => profile ?? undefined);
}

function create(json: UserProfile): Promise<UserProfile> {
    const profile = new UserProfileModel(json);
    return profile.save();
}

function update(userid: string, profile: UserProfile): Promise<UserProfile | undefined> {
    return UserProfileModel.findOneAndUpdate(
        { userid },
        profile,
        { new: true }
    ).then((updated) => updated ?? undefined);
}

export default { get, create, update };
