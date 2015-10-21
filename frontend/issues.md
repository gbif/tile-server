# known issues

_Tested browsers_

* Chrome mac
* Chrome win
* Safari
* Firefox mac
* Firefox win
* Opera mac/win
* ie8
* ie9
* ie10
* ie11
* Android chrome
* iOS Chrome
* iOS Safari
* Linux firefox

## ie8 XP

* no timeslider or filters
* no bounding box (CORS issue)
* No fullscreen (no regression).

## ie9 W7

* thin grey lines on border on some zoom levels
* no bounding box (CORS issue)
* has mobile layout
* When in an iframe there is sometimes unwanted lines in the menu . Readable, but ugly.
* when scrolling menu, you can over scroll into page. annoying.
* No fullscreen (no regression).

## ie10 W7

* mobile layout
* when scrolling menu, you can over scroll into page. annoying.
* No fullscreen (no regression).

## ie11 W7

* Tiles sometimes missing. unstable and appears on refresh. only happens with map-box tiles. unclear what the reason is and if only in virtual mode. An actual ie11 would be needed to test further.

## Safari - Yosimity

* When clicking back and showing the page again, the iframe is missing 5mm in the right side.

## Firefox

* Scrolling a bit slower than other browsers. General FF behavior.

##Android

Chrome
Shows the map. pinch zoom fails hard.

# Linux firefox
zoom speed on linux // Linux  and modest maps issue - rewrite modest maps or linux or agent sniff and emphasize FF scroll

# Other

## Won't fix for now
Markers and bounding boxes does not wrap (No regression)