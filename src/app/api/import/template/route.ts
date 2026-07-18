import { NextRequest, NextResponse } from "next/server";

// Tải file mẫu CSV cho 3 loại: danh-muc-xe, nha-cung-cap, shipments
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "danh-muc-xe";

  let csv = "";
  let filename = "";

  switch (type) {
    case "danh-muc-xe":
      filename = "mau-danh-muc-xe.csv";
      csv = [
        "Bien so,Loai xe,Hang xe,Mau xe,Tai trong (kg),Nhien lieu,Trang thai,Ma NCC,Ten tai xe,Sdt tai xe",
        "51C 47495,CONT 40 RF,Hyundai,HD270,30000,diesel,hoatdong,NCC001,LE VAN BINH,0942043414",
        "60C 4287,MOOC RAO,Thaco,Foton 9T,15000,diesel,hoatdong,NCC002,NGUYEN VAN A,0912345678",
        "29E 73087,CONT 45 HC,Isuzu,FRR90,12000,diesel,baotri,NCC001,TRAN VAN B,0987654321",
        "36G 00073,XE TAI,Hino,500 Series,8000,diesel,hoatdong,,PHAM SY NHUT,0974124068",
      ].join("\n");
      break;

    case "nha-cung-cap":
      filename = "mau-nha-cung-cap.csv";
      csv = [
        "Ma NCC,Ten don vi,Sdt,Email,Dia chi,Nguoi lien he,Sdt lien he,Ma so thue,Ghi chu",
        "NCC001,Cong ty CP Van tai container Phuong Dong,02838901234,info@phuongdong.vn,KCN Tan Cang TP HCM,Tran Van Hung,0901234567,0123456789,Uu tien cont RF",
        "NCC002,Cong ty TNHH Van tai Binh Minh,02439876543,info@binhminh.vn,Cang Hai Phong,Le Thi Mai,0912345678,0987654321,Chuyen chay bac nam",
        "NCC003,Doanh nghiep tu Van tai Dai Nam,02363654321,,Cang Tien Sa Da Nang,Pham Quoc Bao,0923456789,,",
      ].join("\n");
      break;

    case "shipments":
      filename = "mau-don-hang.csv";
      csv = [
        "Lo trinh,Ngay di,Gio di,Bien so,So mooc,So cont,Ten tai xe,Sdt tai xe,Ma KH,Ten KH,Mat hang,SALE,DP,Ghi chu 1,Ghi chu 2,Ghi chu 3",
        "BAC NINH - HCM,17/07/2026,08:00,51C 47495,50RM 15513,TCLU 1071990,LE VAN BINH,0942043414,GTVD,Cty GTVD,PALET,HIEN,ANH,Ghi chu 1,Ghi chu 2,Ghi chu 3",
        "HAI PHONG - DA NANG,18/07/2026,06:30,60C 4287,,,NGUYEN VAN A,0912345678,NCC002,Cty Binh Minh,DIEN TU,LINH,HIEP,,,",
        "HA NOI - CAN THO,19/07/2026,14:00,29E 73087,50RM 16000,TCLU 2099888,TRAN VAN B,0987654321,GTVD,Cty GTVD,HANG ROI,MAY,ANH,Ghi chu,,,",
      ].join("\n");
      break;

    default:
      return NextResponse.json({ error: "Loai khong hop le" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
