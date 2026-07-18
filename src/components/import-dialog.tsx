"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, FileText, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImportType = "danh-muc-xe" | "nha-cung-cap" | "shipments";

const TYPE_META: Record<ImportType, { title: string; apiPath: string; templatePath: string; desc: string }> = {
  "danh-muc-xe": {
    title: "Import danh mục xe",
    apiPath: "/api/import/danh-muc-xe",
    templatePath: "/api/import/template?type=danh-muc-xe",
    desc: "Import xe từ file CSV. Cột: Biển số, Loại xe, Hãng xe, Mẫu xe, Tải trọng, Nhiên liệu, Trạng thái, Mã NCC, Tên tài xế, SĐT tài xế.",
  },
  "nha-cung-cap": {
    title: "Import nhà cung cấp",
    apiPath: "/api/import/nha-cung-cap",
    templatePath: "/api/import/template?type=nha-cung-cap",
    desc: "Import NCC từ file CSV. Cột: Mã NCC, Tên đơn vị, SĐT, Email, Địa chỉ, Người liên hệ, SĐT liên hệ, Mã số thuế, Ghi chú.",
  },
  shipments: {
    title: "Import đơn hàng",
    apiPath: "/api/import/shipments",
    templatePath: "/api/import/template?type=shipments",
    desc: "Import đơn hàng từ file CSV. Cột: Lộ trình, Ngày đi, Giờ đi, Biển số, Số Mooc, Số Cont, Tên tài xế, SĐT, Mã KH, Tên KH, Mặt hàng, SALE, DP, Ghi chú 1/2/3.",
  },
};

export function ImportDialog({
  open, onOpenChange, type, onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: ImportType;
  onImported?: () => void;
}) {
  const qc = useQueryClient();
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<string[][] | null>(null);
  const [result, setResult] = React.useState<{ success: number; errors: number; errorDetails: string[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const meta = TYPE_META[type];

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setParsedRows(null);
      setResult(null);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const rows = lines.map((line) => line.split(",").map((c) => c.trim()));
      setParsedRows(rows);
    };
    reader.readAsText(f, "UTF-8");
  };

  const handleDownloadTemplate = () => {
    window.open(meta.templatePath, "_blank");
  };

  const importMutation = useMutation({
    mutationFn: () => api.post<{ success: number; errors: number; errorDetails: string[] }>(meta.apiPath, { rows: parsedRows }),
    onSuccess: (data) => {
      setResult(data);
      if (data.success > 0) {
        toast.success(`Đã import ${data.success} dòng`);
        // Invalidate relevant queries
        if (type === "danh-muc-xe") {
          qc.invalidateQueries({ queryKey: ["xe-thong-ke"] });
          qc.invalidateQueries({ queryKey: ["vehicles"] });
        } else if (type === "nha-cung-cap") {
          qc.invalidateQueries({ queryKey: ["nha-cung-cap"] });
        } else if (type === "shipments") {
          qc.invalidateQueries({ queryKey: ["shipments"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["tracking"] });
        }
        onImported?.();
      }
      if (data.errors > 0) {
        toast.warning(`${data.errors} dòng lỗi`);
      }
    },
    onError: (e: Error) => toast.error("Import thất bại", { description: e.message }),
  });

  const canImport = parsedRows && parsedRows.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-500" /> {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nút tải mẫu */}
          <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">File mẫu CSV</p>
                <p className="text-xs text-muted-foreground">Tải về, điền dữ liệu, rồi upload lên</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Tải mẫu
            </Button>
          </div>

          {/* Upload file */}
          <div className="space-y-1.5">
            <Label>Chọn file CSV</Label>
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                file ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : "hover:bg-muted/50"
              )}
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedRows ? `${parsedRows.length - 1} dòng dữ liệu • ${parsedRows[0]?.length || 0} cột` : "Đang đọc..."}
                  </p>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { setFile(null); setParsedRows(null); }}>
                    <X className="h-3 w-3" /> Đổi file
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Kéo thả hoặc click để chọn</p>
                  <p className="text-xs text-muted-foreground">Hỗ trợ file .csv</p>
                  <Button size="sm" variant="outline" className="mt-1" onClick={() => fileInputRef.current?.click()}>
                    Chọn file
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview bảng */}
          {parsedRows && parsedRows.length > 1 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Xem trước ({Math.min(parsedRows.length - 1, 5)}/{parsedRows.length - 1} dòng)
              </div>
              <div className="max-h-40 overflow-auto custom-scroll">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/30">
                    <tr>
                      {parsedRows[0].slice(0, 6).map((h, i) => (
                        <th key={i} className="border-b px-2 py-1 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(1, 6).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {row.slice(0, 6).map((c, j) => (
                          <td key={j} className="px-2 py-1 truncate max-w-[100px]">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kết quả import */}
          {result && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.success}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Thành công</p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-2 rounded-lg border p-3",
                  result.errors > 0 ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30" : "border-muted"
                )}>
                  <AlertTriangle className={cn("h-5 w-5", result.errors > 0 ? "text-rose-500" : "text-muted-foreground")} />
                  <div>
                    <p className={cn("text-lg font-bold", result.errors > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>{result.errors}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lỗi</p>
                  </div>
                </div>
              </div>
              {result.errorDetails.length > 0 && (
                <div className="max-h-32 overflow-y-auto custom-scroll rounded-lg border bg-muted/30 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chi tiết lỗi</p>
                  {result.errorDetails.slice(0, 20).map((d, i) => (
                    <p key={i} className="text-xs text-rose-600 dark:text-rose-400">{d}</p>
                  ))}
                  {result.errorDetails.length > 20 && (
                    <p className="text-xs text-muted-foreground">... và {result.errorDetails.length - 20} lỗi khác</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button
            disabled={!canImport || importMutation.isPending}
            onClick={() => importMutation.mutate()}
            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {importMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang import...</>
            ) : (
              <><Upload className="h-4 w-4" /> Import {parsedRows ? `${parsedRows.length - 1} dòng` : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
