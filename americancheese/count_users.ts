
import 'dotenv/config'; // Load .env file
import { db } from "./server/db";
import { users } from "./shared/schema";
import { count } from "drizzle-orm";

async function main() {
    try {
        // Check if db is initialized
        if (!db) {
            console.log("Database connection not established (db object is undefined).");
            process.exit(1);
        }

        const result = await db.select({ count: count() }).from(users);
        console.log(`Total users: ${result[0].count}`);
        process.exit(0);
    } catch (error) {
        console.error("Error counting users:", error);
        process.exit(1);
    }
}

main();
