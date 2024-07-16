import React from "react";
import matrixInverse from "matrix-inverse";
import Strip from "./Strip";
import Bar from "./Bar";
class ThreeGraphs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // n (= 10 ** logN) equals the number of points on horizontal axis
            logN: 1.5,
            mousePressed: false,
            // following two control whether initial values of 1st and 2nd integrals are positive, negative, or zero
            i1i: 0,
            i2i: 0,
            // xva controls what graph user is drawing: position, velocity, or acceleration
            xva: 2,
            showInstructions: true,
            // following controls the number of points included in the smoothing window
            logSmooth: 0,
        }
        this.height = 600;
        this.widthRough = 800;
        this.iiMax = 0.3;
        this.colors = ["blue", "green", "red"];
        // Setting this.M = 4 means that position, velocity, and accelerations will respectively
        // be fit cubically, quadratically, and linearly.
        this.M = 4;
    }

    componentDidMount() {
        // n = # of total points on axis, whereas N = # of points in smoothing window
        let n = Math.round(10 ** this.state.logN);
        let N = Math.round(10 ** this.state.logSmooth) - 1;
        let ss = new Array(n + 1).fill(null);
        // following contains the raw data actually captured by mouseEvents.
        // These will be interpolated, extrapolated, and smoothed.
        let rawYs = {};
        let dt = Math.round(this.widthRough / n);
        let width = n * dt;
        this.setState({ n, N, dt, width, ss, rawYs });
    }

    handleLogN = e => {
        let logN = Number(e.target.value);
        let n = Math.round(10 ** logN);
        let dt = this.state.width / n;
        let width = n * dt;
        let ss = new Array(n + 1).fill(null);
        let [ys, d1s, d2s, i1s, i2s] = [[], [], [], [], []];
        let [d1max, d2max, i1max, i2max] = new Array(4).fill(0);
        this.setState({ logN, n, dt, width, ss, rawYs: {}, ys, d1s, d2s, i1s, i2s, d1max, d2max, i1max, i2max });
    }

    handleLogSmooth = e => {
        let logSmooth = Number(e.target.value);
        let N = this.setN(logSmooth);
        this.setState({ logSmooth, N },() => {
            let { ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(this.state.rawYs, this.state.n);
            this.setState({ mousePressed: false, ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max});
        })
    }

    handleInput = e => {
        this.setState({[e.target.name]: Number(e.target.value)}, () => {
            let { ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(this.state.rawYs, this.state.n);
            this.setState({ ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max});
        });
    }
    toggle = _ => {
        let showInstructions = !this.state.showInstructions;
        this.setState({ showInstructions });
    }
    setN = logSmooth => Math.round(10 ** logSmooth - 1);
    handleDown = e => {
        e.preventDefault();
        let logSmooth = 0;
        let N = this.setN(logSmooth)
        this.setState({ mousePressed: true, rawYs: {}, logSmooth, N });
    }
    handleUp   = e => {
        e.preventDefault();
        let { ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(this.state.rawYs, this.state.n);
        this.setState({ mousePressed: false, ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max});
    };

    handleEnter = e => {
        e.preventDefault();
        let { state, height } = this;
        let { mousePressed } = state;
        // Curve is drawn only if mouse is pressed.
        if (!mousePressed) return;
        let id = Number(e.target.id);
        let rawYs =  {...state.rawYs};
        rawYs[id] = e.nativeEvent.offsetY - height / 2;
        let { ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(rawYs, id);
        this.setState({ rawYs, ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max });
    }

    fit = (rawYs, n) => {
        let { state, iiMax, height } = this;
        let { i1i, i2i, width, dt } = state;
        let M = this.M - this.state.xva;
        let N = this.state.N + M - 1;
        let id = 0;
        let [ys, d1s, d2s, i1s, i2s] = [[], [], [], [], []];
        let [d1max, d2max, i1max, i2max] = [0, 0, 0, 0];

        let ids = Object.keys(rawYs);

        let i1 = -i1i * iiMax * height * width / 2;
        let i2 = -i2i * iiMax * height * (width / 2) ** 2;
        // Start- & end-points of loop must allow inclusion of the smoothing window.
        for (let jId = N; jId < ids.length - N; jId++) {
            let someIds = ids.slice(jId - N, jId + N + 1);
            let vector = new Array(M).fill(0);
            let matrix = [];
            // Fill matrix and inhomogeneous vector whose solution vector'll be the fit parameters.
            for (let i = 0; i < M; i++) matrix.push(new Array(M).fill(0));
            for (const id2 of someIds) {
                for (let i = 0; i < M; i++) {
                    vector[i] += rawYs[id2] * id2 ** i;
                    for (let j = 0; j < M; j++) matrix[i][j] += id2 ** (i + j);
                }
            }
            const matrixInv = matrixInverse(matrix);
            // Now that matrix has been inverted, use it to calculate solution vector.
            const vecSol = new Array(M).fill(0);
            for (let i = 0; i < M; i++) {
                for (let j = 0; j < M; j++) vecSol[i] += matrixInv[i][j] * vector[j];
            }
            // Now that solution vector has been calculated, use it to calculate function & 1st & 2nd integrals and derivatives.
            while (id <= ids[jId] || (jId === ids.length - N - 1 && id <= n)) {
                let y = 0;
                let d1= 0;
                let d2= 0;
                i1s[id] = i1;
                i2s[id] = i2;
                for (let i = 0; i < M; i++) {
                    y += vecSol[i] * id ** i;
                    if (i > 0) d1 += vecSol[i] * (id ** (i - 1)) * i;
                    if (i > 1) d2 += vecSol[i] * (id ** (i - 2)) * i * ( i - 1);
                }
                i1 += y * dt;
                i2 += i1* dt;
                ys[id] = y;
                d1s[id] = d1;
                d2s[id] = d2;
                // Calculate maxes of functions, for optimal plot-scaling purposes.
                d1max = Math.max(d1max, Math.abs(d1));
                d2max = Math.max(d2max, Math.abs(d2));
                i1max = Math.max(i1max, Math.abs(i1));
                i2max = Math.max(i2max, Math.abs(i2));
                id++;
            }
        }
        return {ys, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max};
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLogN, handleInput, handleLogSmooth, height } = this;
        let { ss, rawYs, i1s, d1s, d2s, i2s, width, dt, i1i, i2i, logN, xva, i1max, i2max, d1max, d2max, mousePressed, logSmooth } = state;
        return  !ss ? null : (
            <>
                <button onClick={this.toggle}>{this.state.showInstructions ? "HIDE" : "SHOW"}</button> explanation
                {!this.state.showInstructions ? null : <div>
                    <p align="center"><h1>Graphical Kinematics</h1></p>

                    "Kinematics" is the study of the relationship between the position <span className="x"><i>x</i></span>, velocity <span className="v"><i>v</i></span>, and acceleration <span className="a"><i>a</i></span> of a moving particle.  This app allows you to explore this <i>graphically</i> for a particle which moves in one dimension.
                    <br/><br/>
                    <b>Basics:</b>
                    <ul>
                        <li> In the graphs below, the kinematic quantities (<i>x</i>, <i>v</i>, and <i>a</i>) will be plotted along the vertical axis, while the time <i>t</i> will be along the horizontal axis.
                        The curves for <i className="x">x</i>, <i className="v">v</i>, and <i className="a">a</i> will respectively be <span className="x">blue</span>, <span className="v">green</span>, and <span className="a">red.</span>
                        </li>
                        <li> <em>Slope</em> equals <em>rise</em> divided by <em>run</em>, ie the steepness of a graph. An "uphill" graph has a positive slope, a "downhill" graph has a negative slope, and a horizontal line has zero slope.</li>
                        <li> The slope of the <i className="x">x</i>-graph (at a particular moment <i>t</i>) equals the value of <i className="v">v</i> at that moment.</li>
                        <li> The slope of the <i className="v">v</i>-graph equals the value of <i className="a">a</i> at that moment.</li>
                        <li> The two previous bullets may be restated in calculus terms as follows: the velocity is the derivative of the position, and the acceleration is the derivative of the velocity (and is the <i>second</i> derivative of the position).</li>
                    </ul>

                    <b>Instructions:</b>
                    <ul>
                        <li>Use the first slider to control the number of timesteps that will be used in the graphs.</li>
                        <li>Use the next slider to indicate what function (vs time <i>t</i>) you want to draw with your mouse: <span className="x"><i>x</i></span>, <span className="v"><i>v</i></span>, or <span className="a"><i>a</i></span>.  (The other two functions will be calculated and graphed.)</li>
                        <li>If needed, use the next one or two slider(s) to specify qualitative value(s) for the initial conditions (ie, of <i className="x">x</i> and/or <i className="v">v</i>).</li>
                        <li> Click in the lefthand gray rectangle and drag slowly to the other rectangle in order to create a graph for your chosen quantity.  The dotted line represents zero.</li>
                        <li> After creating your graphs a final slider will materialize which you may use to "smooth" your graphs.</li>
                        <li> Clicking in the graph or in either gray rectangle initializes your graphs.</li>
                    </ul>
                    <b>Notes</b>:
                    <ul>
                        <li>If your chosen resolution is too fine or if the mouse is dragged too quickly it will miss one or more stripes in the DOM, in which case the app fills in those points by interpolation or extrapolation.  If this is an issue, the percentage of missing points will be reported to you when you mouse-up.</li>
                        <li>The derivative of a function is rougher than the function itself, whereas the integral of a function is smoother.  Expressed differently, <i className="x">x</i> is smoother than <i className="v">v</i> which is smoother than <i className="a">a</i>.</li>
                    </ul>
                </div>}
                {(mousePressed || !state.ys || !state.ys.length || Object.keys(rawYs).length === this.state.n + 1) ? null : <p align="center"><i>
                    {`${Math.round(100 * (1 - Object.keys(rawYs).length / (this.state.n + 1)))}% of your graph's points were missing before interpolation/extrapolation.  To decrease this you should either drag your mouse more slowly or lower the spatial resolution.`}
                </i></p>}
                <div className="bothSides">
                    <div className="sliders">
                            <div>
                            <table>
                                <thead><tr><th colSpan="3"><h3>Controls</h3></th></tr></thead>
                                <tbody>
                                    <tr className="spacer"></tr>
                                    <tr><td colSpan="3">Spatial resolution: </td></tr>
                                    <tr>
                                        <td align="right">coarse</td>
                                        <td>
                                            <input
                                                type="range"
                                                onChange={handleLogN}
                                                name="logN"
                                                min="0.5"
                                                max="3"
                                                step="0.25"
                                                value={logN}
                                            />
                                        </td>
                                        <td>fine</td>
                                    </tr>
                                    <tr className="spacer"></tr>
                                    <tr><td colSpan="3">Quantity being mouse-drawn:</td></tr>
                                    <tr>
                                        <td align="right"><i className="x">x</i></td>
                                        <td align="center">
                                            <input
                                                type="range"
                                                onChange={handleInput}
                                                name="xva"
                                                min="0"
                                                max="2"
                                                step="1"
                                                value={xva}
                                            /><br/><i className="v">v</i>
                                        </td>
                                        <td><i className="a">a</i></td>
                                    </tr>
                                    {(xva < 1) ? null :
                                        <>
                                            <tr className="spacer"></tr>
                                            <tr>
                                                <td colSpan="3">
                                                    Initial value of {(xva === 2) ? "velocity" : "position"} <i className={`${(xva === 2) ? "v" :   "x"}`}>{(xva === 2) ? "v" : "x"}</i>:
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="right">negative</td>
                                                <td align="center">
                                                    <input
                                                        type="range"
                                                        onChange={handleInput}
                                                        name="i1i"
                                                        min="-1"
                                                        max="1"
                                                        step="1"
                                                        value={i1i}
                                                    /><br/>0
                                                </td>
                                                <td>positive</td>
                                            </tr>
                                        </>
                                    }
                                    {(xva < 2) ? null :
                                        <>
                                            <tr className="spacer"></tr>
                                            <tr>
                                                <td colSpan="3">Initial value of position <i className="x">x</i>: </td>
                                            </tr>
                                            <tr>
                                                <td align="right">negative</td>
                                                <td align="center">
                                                    <input
                                                        type="range"
                                                        onChange={handleInput}
                                                        name="i2i"
                                                        min="-1"
                                                        max="1"
                                                        step="1"
                                                        value={i2i}
                                                    /><br/>0
                                                </td>
                                                <td>positive</td>
                                            </tr>
                                        </>
                                    }
                                    {(mousePressed || !state.ys || !state.ys.length) ? null :
                                        <>
                                            <tr className="spacer"></tr>
                                            <tr><td colSpan="3">Smoothing: </td></tr>
                                            <tr>
                                                <td align="right">none</td>
                                                <td>
                                                    <input
                                                        type="range"
                                                        onChange={handleLogSmooth}
                                                        name="logSmooth"
                                                        min="0"
                                                        max={logN - 0.35}
                                                        step="0.05"
                                                        value={logSmooth}
                                                    />
                                                </td>
                                                <td>much</td>
                                            </tr>
                                        </>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="strips-container" onMouseDown={handleDown} onMouseUp={handleUp}>
                        <div className="zero" style={{width: `${width}px`, top: `${Math.round(height/   2)}px`}}></div>
                        <div className="strips" style={{height:`${height}px`, width: `${width}px`}}>
                            {ss.map((s, j) => (
                                <>
                                    <Strip
                                        key={`strip${j}`}
                                        j={j}
                                        height={height}
                                        dt={dt}
                                        handleEnter={handleEnter}
                                    />
                                    {(rawYs[j] === undefined || rawYs[j + 1] === undefined ||   !mousePressed) ? null : <Bar
                                        key={`bar${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(rawYs[j] + height / 2)}
                                        y1={Math.round(rawYs[j + 1] + height / 2 )}
                                        color={this.colors[xva]}
                                    />}
                                    {(!state.ys || state.ys[j] === undefined || state.ys[j + 1] ===     undefined || mousePressed) ? null : <Bar
                                        key={`newBar${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(state.ys[j] + height / 2)}
                                        y1={Math.round(state.ys[j + 1] + height / 2 )}
                                        color={this.colors[xva]}
                                    />}
                                    {(!d1s || d1s[j] === undefined || d1s[j + 1] === undefined) ||  xva > 1 ? null : <Bar
                                        key={`d1${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(d1s[j] *  height / 2 / d1max + height / 2)}
                                        y1={Math.round(d1s[j+1] *  height / 2 / d1max + height / 2)}
                                        color={this.colors[(xva + 1) % 3]}
                                    />}
                                    {(!i1s || i1s[j] === undefined || i1s[j + 1] === undefined) ||  xva < 1 ? null : <Bar
                                        key={`i1${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(i1s[j] *  height / 2 / i1max + height / 2)}
                                        y1={Math.round(i1s[j+1] *  height / 2 / i1max + height / 2)}
                                        color={this.colors[(xva + 2) % 3]}
                                    />}
                                    {(!d2s || d2s[j] === undefined || d2s[j + 1] === undefined) ||  xva > 0 ? null : <Bar
                                        key={`d2${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(d2s[j] *  height / 2 / d2max + height / 2)}
                                        y1={Math.round(d2s[j+1] *  height / 2 / d2max + height / 2)}
                                        color={this.colors[(xva + 2) % 3]}
                                    />}
                                    {(!i2s || i2s[j] === undefined || i2s[j + 1] === undefined) ||  xva < 2 ? null : <Bar
                                        key={`i2${j}`}
                                        j={j}
                                        dt={dt}
                                        y={Math.round(i2s[j] *  height / 2 / i2max + height / 2)}
                                        y1={Math.round(i2s[j+1] *  height / 2 / i2max + height / 2)}
                                        color={this.colors[(xva + 1) % 3]}
                                    />}
                                </>
                            ))}
                        </div>
                    </div>
                </div>
                <br/>creator: <a href="https://pknipp.github.io/" target="_blank" rel="noreferrer">Peter Knipp</a>
                <br/>GitHub <a href="https://github.com/pknipp/graphical-kinematics" target="_blank" rel="noreferrer">repo</a>
            </>
        )
    }
}

export default ThreeGraphs;
