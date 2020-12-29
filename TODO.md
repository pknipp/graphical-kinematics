TO DO:
* erase all 3 graphs when re-doing the click-and-drag (including part at end)
* solve phantom-globe bug, if it ever reappears
* Do NOT cancel things if mouse does not detect 1st stripe.
* control the drawn graph not with a mouse but with a vertical slider
* make an additional stripe at end, and synthesize handleLeave with handleEnter
* implement (2*N+1)-point moving-window (M+avx)-degree polynomic fitting of dragged function, in which both N&M depend upon user preference (and - possibly - stripe width).  While doing this, for each point store several items: index of center of window for which this fit was performed, and (M+avx) fitting coefficients.
* consider having the first onMouseEnter event trigger the rendering (albeit temporary) of a horizontal line-segment, to provide reassurance to the user that the mouse is working properly
* enable user to clear the graphs without having to readjust any of the slider(s)
