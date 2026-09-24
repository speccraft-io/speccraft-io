#!/bin/sh
# Renders the HTML sources to PNG at 2x. Run from this directory.
# --virtual-time-budget gives the Google Fonts time to load before the screenshot.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
  --screenshot=positioning.png --window-size=1200,900 "file://$PWD/positioning.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
  --screenshot=positioning-ts.png --window-size=1200,900 "file://$PWD/positioning-ts.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
  --screenshot=speccraft-linkedin-banner.png --window-size=1128,191 "file://$PWD/banner.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
  --screenshot=model-vs-real-code.png --window-size=1200,460 "file://$PWD/model-vs-real-code.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=1 \
  --screenshot=bluesky-banner.png --window-size=1500,500 "file://$PWD/bluesky-banner.html"

for f in lean-proof-fails:522 lean-missing-cap:522 lean-build-ok:186 vitest-cross-check-fails:330 vitest-ok:234 lean-workflow:440; do
  n=${f%%:*}; h=${f##*:}; w=1000; [ "$n" = lean-workflow ] && w=1200
  "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
    --screenshot=tools/lean/$n.png --window-size=$w,$h "file://$PWD/tools/lean/$n.html"
done

for f in dafny-step1:642 dafny-step2:402 dafny-loop:282 dafny-build:210 vitest-old-fails:234 vitest-ok:234 dafny-workflow:440; do
  n=${f%%:*}; h=${f##*:}; w=1000; [ "$n" = dafny-workflow ] && w=1200
  "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
    --screenshot=tools/dafny/$n.png --window-size=$w,$h "file://$PWD/tools/dafny/$n.html"
done

for f in quint-run-bug:1434:1000 quint-verify-bug:210:1000 quint-verify-fixed:186:1000 vitest-replay-fails:282:1000 vitest-replay-ok:234:1000 quint-bug-timeline:620:1200 quint-workflow:490:1200; do
  n=$(echo "$f" | cut -d: -f1); h=$(echo "$f" | cut -d: -f2); w=$(echo "$f" | cut -d: -f3)
  "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
    --screenshot=tools/quint/$n.png --window-size=$w,$h "file://$PWD/tools/quint/$n.html"
done

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=2 \
  --screenshot=tools/quint/quint-architecture.png --window-size=1200,640 "file://$PWD/tools/quint/quint-architecture.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --force-device-scale-factor=1 \
  --screenshot=bluesky-avatar.png --window-size=1000,1000 "file://$PWD/bluesky-avatar.html"

# Pages load the WebP copies. For each PNG with a WebP next to it, keep the smaller of lossy and lossless.
find . -name '*.png' | while read -r png; do
  webp="${png%.png}.webp"
  [ -f "$webp" ] || continue
  cwebp -quiet -q 85 "$png" -o /tmp/render-lossy.webp
  cwebp -quiet -lossless -z 9 "$png" -o /tmp/render-lossless.webp
  if [ "$(stat -f%z /tmp/render-lossy.webp)" -lt "$(stat -f%z /tmp/render-lossless.webp)" ]; then
    mv /tmp/render-lossy.webp "$webp"
  else
    mv /tmp/render-lossless.webp "$webp"
  fi
done
