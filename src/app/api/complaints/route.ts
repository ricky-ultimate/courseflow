import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../prisma/prima';

export async function POST(req: NextRequest) {
  const { name, department, email, message } = await req.json();

  try {
    const complaint = await prisma.complaint.create({
      data: { name, department, email, message },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try{
        const complaints = await prisma.complaint.findMany()
        return NextResponse.json(complaints, {status: 200})
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }
}
