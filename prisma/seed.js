import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Movie Watchlist Database Seeding ---');

  const jsonPath = path.resolve(__dirname, '../data/movies.json');
  const fileContent = await fs.readFile(jsonPath, 'utf-8');
  const movies = JSON.parse(fileContent);

  console.log(`Found ${movies.length} movies to seed.`);

  for (const movie of movies) {
    const data = {
      id: Number(movie.id),
      title: movie.title,
      overview: movie.synopsis || movie.overview || '',
      release_year: Number(movie.year || movie.release_year || 0),
      genres: Array.isArray(movie.genres) ? movie.genres : [],
      poster_url: movie.poster_url || null,
      rating: movie.rating !== undefined && movie.rating !== null ? Number(movie.rating) : 0,
      duration: movie.duration || null,
    };

    await prisma.movie.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  console.log(`Successfully seeded ${movies.length} movies into PostgreSQL database.`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

