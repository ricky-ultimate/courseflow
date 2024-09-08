import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, department, email, message, status } = await req.json();

    const complaint = await prisma.complaint.create({
      data: { name, department, email, message, status: "unresolved" },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
  }
}

export async function GET() {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(complaints);
  }
