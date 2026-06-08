import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adminEmail = (process.env.ADMIN_EMAIL ?? "ponepuck@gmail.com")
  .trim()
  .toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? (await readPasswordFromStdin());

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is required.");
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/agentic_writing";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  const passwordHash = hashPassword(adminPassword);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN"
    },
    update: {
      passwordHash,
      role: "ADMIN"
    }
  });

  await prisma.authSession.deleteMany({ where: { userId: user.id } });
  console.log(`Admin user ensured: ${adminEmail}`);
} finally {
  await prisma.$disconnect();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);

  return ["scrypt", salt, derivedKey.toString("hex")].join(":");
}

async function readPasswordFromStdin() {
  if (process.stdin.isTTY) {
    return "";
  }

  let input = "";

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  return input.trim();
}
