# Unfinished features/scrapers

These files were created a while ago for some feature but were never finished or haven't been used in a long time. 
If we ever want to add them back, we can copy them from here.

They are in the codebase at commit [0958ad3a2ddf72425f3e18b268e9d2dd6c945f88](https://github.com/ryanhugh/searchneu/commit/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88).

### login.js

This code started with just a MyNEU username and password.  
And logged into the old MyNEU (yeah, the one that was taken down in 2018 and is no longer around)  
and then navigated to TRACE using only raw requests and not a headless browser.  
which made it pretty fast - and avoided unneeded dependencies on headless browsers.  

https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/scrapers/login/login.js

### psylink.js

Scraper for http://psylink.psych.neu.edu/ to get the list of avalible studies.

https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/scrapers/psylink/psylink.js


### clubs.js

If we ever want to add support for clubs at Northeastern, we can work on this file some more.
It pulls data about clubs from a few spots on Northeastern's website (orgsync).

https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/scrapers/clubs.js
https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/scrapers/tests/clubs.test.js


### buildings.js

If we ever want to add support for buildings at Northeastern, we can work on this file some more.
It pulls data about buildings from a few spots on Northeastern's website.

https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/scrapers/buildings.js


### calendar.js

run yarn add ics when this file is used again
This file is for this feature https://github.com/ryanhugh/searchneu/issues/61

https://github.com/ryanhugh/searchneu/blob/0958ad3a2ddf72425f3e18b268e9d2dd6c945f88/backend/calendar.js
