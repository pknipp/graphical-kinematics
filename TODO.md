TO DO:
* Smooth the derivative, perhaps based upon the chosen resolution.
* Include the last 2 points in the derivative curve and the last point in the integral curve.
* Allow the user to choose (from drop-down) whether he/she is drawing x, v, or a.
* Depending upon whether user chooses x, v, or a, place 0, 1, or 2 vertical sliders next to the graph in order to set the IC.  (This'll need to resize, as ifac and dfac change.)
* Make the app more sympathetic to missed stripes.  Detect gaps and interpolate them?
* extract integration and differentiation methods from mouseEnter &/or mouseLeave handlers and make them separate methods
* synthesize mouseEnter and MouseLeave into a single handler which is passed a boolean
* enable user to clear the graphs without having to readjust any of the slider(s)
