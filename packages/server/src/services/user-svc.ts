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

function index(): Promise<UserProfile[]> {
    return UserProfileModel.find();
}

function get(userid: string): Promise<UserProfile | undefined> {
    return UserProfileModel.find({ userid })
        .then((list) => list[0])
        .catch(() => {
            throw `${userid} Not Found`;
        });
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
    ).then((updated) => {
        if (!updated) throw `${userid} not updated`;
        else return updated as UserProfile;
    });
}

function remove(userid: string): Promise<void> {
    return UserProfileModel.findOneAndDelete({ userid })
        .then((deleted) => {
            if (!deleted) throw `${userid} not deleted`;
        });
}

export default { index, get, create, update, remove };
