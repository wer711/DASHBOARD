#!/bin/bash
# سكربت بناء Vercel
# يقوم بـ:
# 1. التحقق من وجود الملفات الأساسية
# 2. تبديل مزوّد Prisma من SQLite إلى PostgreSQL
# 3. توليد عميل Prisma
# 4. دفع المخطط إلى قاعدة البيانات
# 5. بناء Next.js
set -e

echo "=========================================="
echo "=== Vercel Build Script - Sada Analytics ==="
echo "=========================================="
echo ""
echo "--- Current directory contents ---"
ls -la
echo ""

echo "--- Checking critical files ---"
for f in package.json vercel.json next.config.ts tsconfig.json prisma/schema.prisma scripts/vercel-build.sh; do
  if [ -f "$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ MISSING: $f"
    exit 1
  fi
done
echo ""

echo "--- Prisma provider before ---"
grep "provider" prisma/schema.prisma | head -2

# تبديل المزوّد إلى PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "--- Prisma provider after ---"
grep "provider" prisma/schema.prisma | head -2
echo ""

# التأكد من وجود DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please add your Vercel Postgres connection string as DATABASE_URL"
  exit 1
fi
echo "✓ DATABASE_URL is set (length: ${#DATABASE_URL})"
echo ""

echo "=== Generating Prisma Client ==="
npx prisma generate || bunx prisma generate
echo ""

echo "=== Pushing schema to Postgres ==="
npx prisma db push || bunx prisma db push
echo ""

echo "=== Building Next.js ==="
npx next build || bunx next build
echo ""

echo "=========================================="
echo "=== ✅ Build complete ==="
echo "=========================================="
