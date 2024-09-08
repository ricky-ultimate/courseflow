import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const complaintId = parseInt(params.id, 10);
    try {
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: { status: 'resolved' }, // Set status to resolved
      });

      return NextResponse.json(updatedComplaint, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
    }
  }
