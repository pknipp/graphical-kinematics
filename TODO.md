TO DO:
* solve phantom-globe bug, if it ever reappears
* control the drawn graph not with a mouse but with a vertical slider
* implement (2N+1)-point moving-window (M+avx)-degree polynomic fitting of dragged function, in which both N&M depend upon user preference (and - possibly - stripe width).  While doing this, for each point store several items: index of center of window for which this fit was performed, and (M+avx) fitting coefficients.
* consider having the first onMouseEnter event trigger the rendering (albeit temporary) of a horizontal line-segment, to provide reassurance to the user that the mouse is working properly
* enable user to clear the graphs without having to readjust any of the slider(s)
