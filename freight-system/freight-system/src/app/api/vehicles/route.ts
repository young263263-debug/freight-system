import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles, drivers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireStaff, badRequest } from "@/lib/api-helpers";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;
  const rows = await db
    .select({ vehicle: vehicles, driverName: drivers.name })
    .from(vehicles)
    .leftJoin(drivers, eq(vehicles.driverId, drivers.id))
    .orderBy(desc(vehicles.createdAt));
  return NextResponse.json(rows.map((r) => ({ ...r.vehicle, driverName: r.driverName })));
}

export async function POST(req: NextRequest) {
  const { res } = await requireStaff();
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body?.plateNumber) return badRequest("請輸入車牌號碼");

  const [row] = await db
    .insert(vehicles)
    .values({
      plateNumber: body.plateNumber,
      vehicleType: body.vehicleType || null,
      driverId: body.driverId ? Number(body.driverId) : null,
      transportCompany: body.transportCompany || null,
      insuranceCompany: body.insuranceCompany || null,
      insuranceExpiry: body.insuranceExpiry || null,
      inspectionDueDate: body.inspectionDueDate || null,
      notes: body.notes || null,
      active: body.active ?? true,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
