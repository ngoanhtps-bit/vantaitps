# Hướng dẫn Deploy Logistics App V2 lên Vercel

## Bước 1: Up code lên GitHub

```bash
# Trong thư mục project
git add -A
git commit -m "Logistics App V2 - Ready for deploy"
git remote add origin https://github.com/ngoanhtps-bit/logistics-app-v2.git
git branch -M main
git push -u origin main
```

## Bước 2: Tạo database PostgreSQL

### Cách 1: Vercel Postgres (khuyên dùng)
1. Vào Vercel Dashboard → project → Storage tab
2. Create Database → Postgres
3. Tự động thêm DATABASE_URL

### Cách 2: Neon (miễn phí)
1. Vào neon.tech → đăng ký
2. Tạo project → copy connection string
3. Format: postgresql://user:pass@host/db?sslmode=require

### Cách 3: Supabase (miễn phí)
1. Vào supabase.com → đăng ký
2. Tạo project → Settings → Database → connection string

## Bước 3: Deploy lên Vercel

1. Vào vercel.com → "Add New" → "Project"
2. Import repository logistics-app-v2
3. Cấu hình:
   - Framework Preset: Next.js
   - Build Command: next build
   - Install Command: npm install
4. Environment Variables:
   - DATABASE_URL = postgresql://... (từ bước 2)
5. Click "Deploy"

## Bước 4: Đổi Prisma provider sang PostgreSQL

Trước khi deploy, sửa file `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // đổi từ "sqlite" sang "postgresql"
  url      = env("DATABASE_URL")
}
```

## Bước 5: Push database schema

Sau khi deploy thành công, chạy:

```bash
# Cài prisma global
npm install -g prisma

# Set DATABASE_URL (từ Vercel)
export DATABASE_URL="postgresql://..."

# Push schema lên database
npx prisma db push

# Chạy seed (tạo dữ liệu mẫu)
npx prisma db seed
```

Hoặc thêm script vào package.json:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

## Bước 6: Kiểm tra

1. Vào URL Vercel cấp (vd: logistics-app-v2.vercel.app)
2. Đăng nhập: admin / 123456
3. Kiểm tra các tính năng

## Lưu ý quan trọng

- **SQLite không dùng được trên Vercel** (file system read-only)
- **Bắt buộc dùng PostgreSQL** cho production
- **Prisma client** cần generate lại khi đổi provider
- **DATABASE_URL** phải có `?sslmode=require` ở cuối (Neon/Supabase)

## Khắc phục lỗi thường gặp

### Lỗi: "PrismaClientInitializationError"
→ Kiểm tra DATABASE_URL đúng format PostgreSQL

### Lỗi: "Database connection timeout"
→ Thêm `?connection_limit=5` vào DATABASE_URL

### Lỗi: "Table does not exist"
→ Chạy `npx prisma db push` để tạo bảng

### Lỗi: "PrismaClient is not defined"
→ Thêm `"postinstall": "prisma generate"` vào package.json
