TO DO:
* Smooth the derivative, perhaps based upon the chosen resolution.
* Allow the user to choose (from drop-down) whether he/she is drawing x, v, or a.
* Make the app more sympathetic to missed stripes.  Detect gaps and interpolate them?
* separate onMouse event handler from setState({ ys }), to allow for the possibility that interpolation may be required, in case stripes are missed (alternatively, have the onMouse handler call a helper function for the interpolation)
* consider having the first onMouseEnter event trigger the rendering (albeit temporary) of a horizontal line-segment, to provide reassurance to the user that the mouse is working properly
* extract integration and differentiation methods from mouseEnter &/or mouseLeave handlers and make them separate methods
* synthesize mouseEnter and MouseLeave into a single handler which is passed a boolean
* enable user to clear the graphs without having to readjust any of the slider(s)
