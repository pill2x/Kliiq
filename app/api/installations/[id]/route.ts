import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    const { status } = await request.json();

    // Validate status
    if (!['installed', 'broken', 'updating', 'uninstalled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 },
      );
    }

    // Find installation
    const installation = await prisma.installation.findUnique({
      where: { id: params.id },
      include: {
        application: true,
        version: true,
      },
    });

    if (!installation || installation.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Installation not found' },
        { status: 404 },
      );
    }

    // Handle uninstall
    if (status === 'uninstalled') {
      await prisma.installation.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Installation removed',
      });
    }

    // Update installation status
    const updated = await prisma.installation.update({
      where: { id: params.id },
      data: { status },
      include: {
        application: true,
        version: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        applicationName: updated.application.name,
        version: updated.version.versionNumber,
        status: updated.status,
        installPath: updated.installPath,
        installedAt: updated.installedAt,
        applicationId: updated.applicationId,
      },
    });
  } catch (error) {
    console.error('Error updating installation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update installation' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // Find and delete installation
    const installation = await prisma.installation.findUnique({
      where: { id: params.id },
    });

    if (!installation || installation.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Installation not found' },
        { status: 404 },
      );
    }

    await prisma.installation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Installation deleted',
    });
  } catch (error) {
    console.error('Error deleting installation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete installation' },
      { status: 500 },
    );
  }
}
