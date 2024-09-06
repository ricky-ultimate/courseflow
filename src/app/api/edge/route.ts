import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const neon = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL });
    const adapter = new PrismaNeon(neon);
    const prisma = new PrismaClient({ adapter });

    const complaints = await prisma.complaint.findMany();
    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}
