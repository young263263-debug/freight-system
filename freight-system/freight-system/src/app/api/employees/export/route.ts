import { db } from "@/db";
import { employees } from "@/db/schema";
import { requireStaff } from "@/lib/api-helpers";
import { buildXlsxResponse } from "@/lib/xlsx-export";
import { toNumber } from "@/lib/utils";

export async function GET() {
  const { res } = await requireStaff();
  if (res) return res;

  const rows = await db.select().from(employees);

  return buildXlsxResponse(
    "員工名冊",
    [
      { header: "姓名", key: "name", width: 14 },
      { header: "身分證字號", key: "idNumber", width: 16 },
      { header: "電話", key: "phone", width: 16 },
      { header: "地址", key: "address", width: 30 },
      { header: "職稱", key: "position", width: 14 },
      { header: "到職日", key: "hireDate", width: 14 },
      { header: "月薪", key: "monthlySalary", width: 12 },
      { header: "勞保金額", key: "laborInsuranceAmount", width: 12 },
      { header: "健保金額", key: "healthInsuranceAmount", width: 12 },
      { header: "健保眷屬人數", key: "healthInsuranceDependents", width: 14 },
      { header: "在職狀態", key: "activeText", width: 10 },
      { header: "備註", key: "notes", width: 24 },
    ],
    rows.map((e) => ({
      name: e.name,
      idNumber: e.idNumber ?? "",
      phone: e.phone ?? "",
      address: e.address ?? "",
      position: e.position ?? "",
      hireDate: e.hireDate ?? "",
      monthlySalary: toNumber(e.monthlySalary),
      laborInsuranceAmount: toNumber(e.laborInsuranceAmount),
      healthInsuranceAmount: toNumber(e.healthInsuranceAmount),
      healthInsuranceDependents: e.healthInsuranceDependents,
      activeText: e.active ? "在職" : "離職",
      notes: e.notes ?? "",
    })),
    "員工名冊.xlsx"
  );
}
