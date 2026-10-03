import { Schema, model } from "mongoose";
import { UserProfile } from "../models";

const userProfileSchema = new Schema(
    {
        userid: { type: String, required: true },
        username: { type: String, required: true },
        displayName: { type: String, required: true },
        bio: { type: String, required: false },
        profilePicture: { type: String, required: false }
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

function remove(userid: string): Promise<boolean> {
    return UserProfileModel.findOneAndDelete({ userid })
        .then((deleted) => Boolean(deleted));
}

export default { get, create, update, remove };
