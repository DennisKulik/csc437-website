import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

function port(): number {
    const value = process.env.PORT;
    if (!value) return 3000;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535");
    }

    return parsed;
}

export const config = {
    mongoUser: required("MONGO_USER"),
    mongoPassword: required("MONGO_PWD"),
    mongoCluster: required("MONGO_CLUSTER"),
    tokenSecret: required("TOKEN_SECRET"),
    port: port(),
    staticDir: process.env.STATIC?.trim() || "public"
};
