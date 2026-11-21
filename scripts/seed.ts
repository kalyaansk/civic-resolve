import fs from "node:fs";
import path from "node:path";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_ISSUES } from "../src/lib/data/seedIssues";

/**
 * Seeds the Cloud Firestore `issues` collection with 8 localized Indian civic reports
 * using Google Application Default Credentials (ADC), overwriting canonical docs in place.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *   export GOOGLE_CLOUD_PROJECT=your-project-id   # or set in .env.local
 *   npm run seed
 */
function loadProjectIdFromDotEnvLocal(): void {
  if (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return;
  }
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(
      /^(GOOGLE_CLOUD_PROJECT|NEXT_PUBLIC_FIREBASE_PROJECT_ID)=(.*)$/,
    );
    if (match && match[1] && match[2]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function main(): Promise<void> {
  loadProjectIdFromDotEnvLocal();

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!projectId || projectId === "your_gcp_project_id") {
    console.error(
      "Missing GOOGLE_CLOUD_PROJECT or NEXT_PUBLIC_FIREBASE_PROJECT_ID. Set it before running `npm run seed`.",
    );
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const db = getFirestore();
  const batch = db.batch();

  for (const issue of SEED_ISSUES) {
    const ref = db.collection("issues").doc(issue.id);
    batch.set(ref, issue);
  }

  await batch.commit();
  console.log(
    `Successfully seeded ${SEED_ISSUES.length} localized Indian civic issues into Firestore project "${projectId}".`,
  );
}

main().catch((error) => {
  console.error("Failed to seed Firestore:", error);
  process.exit(1);
});
