#!/bin/sh
# Renders the HTML sources to PNG at 2x. Run from this directory.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --screenshot=positioning.png --window-size=1200,900 "file://$PWD/positioning.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --screenshot=speccraft-linkedin-banner.png --window-size=1128,191 "file://$PWD/banner.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --screenshot=model-vs-real-code.png --window-size=1200,460 "file://$PWD/model-vs-real-code.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --screenshot=bluesky-banner.png --window-size=1500,500 "file://$PWD/bluesky-banner.html"
