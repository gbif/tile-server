#Known issues

Tested in following browsers and operating systems. If no comments, then no issues have been detected.

##Windows
IE8 - XP
have very limited support.
you can see the map, pan and zoom. 
But cannot change baselayer and resolution (regression), 
nor filter or fullscreen (no regression).

IE9 - W7
Only mobile layout and no full screen (no regression).

IE10+IE11 - W7
No fullscreen (no regression).

Edge
Not tested

Chrome - W7
Firefox - W7
Opera - W7

##OSX - Yosimity
Safari
iFrame does not react when first loaded. Needs to be reloaded to react. (No regression)

Chrome

Firefox
Scrolling a bit slower than other browsers. General FF behavior.

Opera

##Android
Chrome
Shows the map. pinch zoom fails hard.

##iOS
Chrome
Safari


#No regression
full screen ie11+ie10 (no regression)
Safari zoom in iframe disabled until refresh (no regression)
Fullscreen disabled on point maps // (no regression) it doesn't work on those pages. Seemingly the parent page is preveting it. 

#Seemingly fixed
relaitve urls for api (naturally) // fixed
zoom using trackpad scroll beyond iframe - fixed
firefox zoom touchpad is slow and scrolls page as well - fixed
point size is meaningless for marker based maps.
remove button from ie11 and other browsers that does not support standards
Timeslider wraps to two lines on Firefox Linux - looks silly. - Fixed

#Linux issues
firefox zoom speed on linux // Linux  and modest maps issue - rewrite modest maps or linux or agent sniff and emphasize FF scroll


#Won't fix for now
Markers and bounding boxes does not wrap (No regression) // won't fix
