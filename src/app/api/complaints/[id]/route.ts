import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/prisma';


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const complaintId = parseInt(params.id, 10);
  try {
    await prisma.complaint.delete({
      where: { id: complaintId },
    });
    return NextResponse.json({ message: 'Complaint deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
