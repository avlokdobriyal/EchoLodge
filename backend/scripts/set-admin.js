// Grants or revokes the ADMIN role. Deliberately a local CLI script rather than
// an API route: there is no way to become an admin over the network, so the
// privilege can only ever be handed out by whoever holds the database
// credentials (the owner).
//
//   npm run set-admin -- guest@example.com          # promote to ADMIN
//   npm run set-admin -- guest@example.com --revoke # demote to USER
//   npm run set-admin -- --list                     # show current admins
//
// After a promotion the backend honours it immediately (requireAdmin reads the
// database on every request). The frontend nav reads the role from the NextAuth
// session token, so the promoted user must sign out and back in once for the
// Admin link to appear.
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, name: true },
    orderBy: { id: 'asc' },
  });
  if (admins.length === 0) {
    console.log('No admins yet. Promote one with: npm run set-admin -- you@example.com');
    return;
  }
  console.log(`${admins.length} admin(s):`);
  for (const a of admins) {
    console.log(`  #${a.id}  ${a.email}${a.name ? `  (${a.name})` : ''}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    return listAdmins();
  }

  const revoke = args.includes('--revoke');
  const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: npm run set-admin -- <email> [--revoke]');
    console.error('       npm run set-admin -- --list');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account found for "${email}". The user must register first.`);
    process.exitCode = 1;
    return;
  }

  const role = revoke ? 'USER' : 'ADMIN';
  if (user.role === role) {
    console.log(`${email} is already ${role} — nothing to do.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`${email}: ${user.role} → ${role}`);
  console.log(
    revoke
      ? 'Revocation is effective immediately, including for existing sessions.'
      : 'Ask them to sign out and back in so the Admin link appears in the nav.'
  );
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
