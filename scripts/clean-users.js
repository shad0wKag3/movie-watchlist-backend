/**
 * scripts/clean-users.js
 *
 * Safely deletes ALL user accounts and their associated Watchlist / Watched records
 * from the database. Useful for resetting test state before a fresh demo or deployment.
 *
 * Usage:  node scripts/clean-users.js
 * npm:    npm run db:clean-users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanUsers() {
  console.log('Starting database user cleanup...');

  try {
    // Delete child records first to avoid foreign-key violations
    const deletedWatched = await prisma.watched.deleteMany({});
    console.log(`  Deleted ${deletedWatched.count} Watched record(s)`);

    const deletedWatchlist = await prisma.watchlist.deleteMany({});
    console.log(`  Deleted ${deletedWatchlist.count} Watchlist record(s)`);

    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`  Deleted ${deletedUsers.count} User account(s)`);

    console.log('User cleanup completed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();

