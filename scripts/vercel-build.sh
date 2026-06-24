#!/bin/bash
# سكربت بناء Vercel
# يقوم بـ:
# 1. التحقق من وجود الملفات الأساسية
# 2. تبديل مزوّد Prisma من SQLite إلى PostgreSQL
# 3. إنشاء DIRECT_URL تلقائياً (لـ Neon pooled connections)
# 4. توليد عميل Prisma
# 5. دفع المخطط إلى قاعدة البيانات (يستخدم DIRECT_URL)
# 6. بناء Next.js (يستخدم DATABASE_URL المُجمَّع)
set -e

echo "=========================================="
echo "=== Vercel Build Script - Sada Analytics ==="
echo "=========================================="
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

# التأكد من وجود DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please add your Neon Postgres connection string as DATABASE_URL"
  exit 1
fi
echo "✓ DATABASE_URL is set (length: ${#DATABASE_URL})"

echo ""
echo "--- Prisma provider before ---"
grep "provider" prisma/schema.prisma | head -2

# تبديل المزوّد إلى PostgreSQL
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "--- Prisma provider after ---"
grep "provider" prisma/schema.prisma | head -2
echo ""

# ====== التعامل مع Neon Pooled Connections ======
# روابط Neon المُجمَّعة تحتوي على "-pooler" في اسم المضيف
# prisma db push تحتاج اتصالاً مباشراً (بدون -pooler)
# لذا ننشئ DIRECT_URL تلقائياً بإزالة "-pooler"
if echo "$DATABASE_URL" | grep -q -- "-pooler"; then
  # إنشاء DIRECT_URL بإزالة "-pooler" من اسم المضيف
  DIRECT_URL=$(echo "$DATABASE_URL" | sed 's/-pooler//')
  export DIRECT_URL
  echo "✓ Detected Neon pooled connection"
  echo "✓ DIRECT_URL auto-generated (removed -pooler for migrations)"
  echo "  Direct host: $(echo "$DIRECT_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')"
  echo ""

  # إضافة directUrl إلى مخطط Prisma إن لم يكن موجوداً
  if ! grep -q "directUrl" prisma/schema.prisma; then
    echo "--- Adding directUrl to Prisma schema ---"
    sed -i '/url.*=.*env("DATABASE_URL")/a\  directUrl = env("DIRECT_URL")' prisma/schema.prisma
    echo "✓ directUrl added to schema.prisma"
    echo ""
  fi
else
  echo "✓ Direct connection detected (no -pooler) — using DATABASE_URL for all operations"
  echo ""
fi

echo "=== Generating Prisma Client ==="
npx prisma generate 2>&1 || bunx prisma generate 2>&1
echo ""

echo "=== Pushing schema to Postgres ==="
# يستخدم DIRECT_URL تلقائياً إن وُجد (لأن directUrl مُضبوط في الـ schema)
npx prisma db push 2>&1 || bunx prisma db push 2>&1
echo ""

echo "=== Building Next.js ==="
npx next build 2>&1 || bunx next build 2>&1
echo ""

echo "=========================================="
echo "=== ✅ Build complete ==="
echo "=========================================="
