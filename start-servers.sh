#!/bin/bash
# سكربت تشغيل خوادم التحليلات
# يُشغّل Next.js + live-service في جلسة منفصلة تماماً

cd /home/z/my-project

# تنظيف أي عمليات سابقة
pkill -f "next dev" 2>/dev/null
pkill -f "bun --hot index.ts" 2>/dev/null
sleep 1

# تشغيل Next.js
nohup bun run dev > /tmp/dev-next.log 2>&1 &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"

# تشغيل live-service
cd /home/z/my-project/mini-services/live-service
nohup bun --hot index.ts > /tmp/live-service.log 2>&1 &
LIVE_PID=$!
echo "Live service PID: $LIVE_PID"

# انتظار بدء التشغيل
sleep 5

# التحقق
if kill -0 $NEXT_PID 2>/dev/null; then
  echo "Next.js is running"
else
  echo "Next.js FAILED to start"
fi
if kill -0 $LIVE_PID 2>/dev/null; then
  echo "Live service is running"
else
  echo "Live service FAILED to start"
fi

# الحفاظ على السكربت حياً لمنع reap
echo "Servers started, keeping session alive..."
while true; do
  sleep 60
  if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "$(date): Next.js died, restarting..."
    cd /home/z/my-project
    nohup bun run dev > /tmp/dev-next.log 2>&1 &
    NEXT_PID=$!
  fi
  if ! kill -0 $LIVE_PID 2>/dev/null; then
    echo "$(date): Live service died, restarting..."
    cd /home/z/my-project/mini-services/live-service
    nohup bun --hot index.ts > /tmp/live-service.log 2>&1 &
    LIVE_PID=$!
  fi
done
