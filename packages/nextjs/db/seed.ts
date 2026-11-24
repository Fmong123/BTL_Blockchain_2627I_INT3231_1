import { closeDatabase, database } from "./client";
import { profiles } from "./schema";
import { loadEnvConfig } from "@next/env";

async function seed() {
  loadEnvConfig(process.cwd(), true);
  const url = process.env.DATABASE_URL;
  if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    throw new Error("Demo seeding requires a local PostgreSQL database.");
  }
  await database()
    .insert(profiles)
    .values([
      {
        wallet: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        kind: "person",
        name: "Tác giả UET (mẫu)",
        role: "Người sáng tác",
        organizationCode: "",
        website: "",
        authority: "",
        isPublic: true,
      },
      {
        wallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        kind: "organization",
        name: "Nhóm Sáng tạo UET (mẫu)",
        role: "Đại diện / quản lý",
        organizationCode: "",
        website: "",
        authority: "Hồ sơ giả lập phục vụ demo",
        isPublic: false,
      },
    ])
    .onConflictDoNothing();
  console.log("Demo wallet profiles are ready.");
}

void seed()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
