import React from "react";
import matrixInverse from "matrix-inverse";
import Strip from "./Strip";
import Bar from "./Bar";
// import IC from "./IC";
class ThreeGraphs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logN: 2.0,
            width: 1000,
            mousePressed: false,
            ys: {},
            d1max: 0,
            d2max: 0,
            i1max: 0,
            i2max: 0,
            i1s: [0],
            d1s:[0],
            i2s: [0],
            d2s: [0],
            i1i: 0,
            i2i: 0,
            avx: 0,
            id: -1,
            showInstructions: true,
        }
        this.height = 500;
        this.iiMax = 0.3;
        this.colors = ["red", "green", "blue"];
        this.N = 2;
        this.M = 4;
    }

    componentDidMount() {
        let n = Math.round(10 ** this.state.logN);
        let ss = new Array(n + 1).fill(null);
        let ys = {};
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        this.setState({ n, dt, width, ss, ys });
    }

    handleLogN = e => {
        let logN = Number(e.target.value);
        let n = Math.round(10 ** logN);
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        let ss = new Array(n + 1).fill(null);
        this.setState({ logN, n, dt, width, ss });
    }

    handleInput = e => this.setState({[e.target.name]: Number(e.target.value)});
    handleCheckbox = e => this.setState({[e.target.name]: e.target.checked});
    handleToggle = e => this.setState({[e.target.name]: e.target.checked});
    handleDown = e => {
        e.preventDefault();
        this.setState({ mousePressed: true, ys: {} });
    }
    handleUp   = e => {
        e.preventDefault();
        let { newYs, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(this.state.ys, this.state.n);
        this.setState({ mousePressed: false,
            newYs, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max
        });
    };

    handleEnter = e => {
        e.preventDefault();
        let { state, height } = this;
        let { mousePressed } = state;
        if (!mousePressed) return;
        let id = Number(e.target.id);
        let ys =  {...state.ys};
        let y3 = e.nativeEvent.offsetY - height / 2;
        ys[id] = y3;
        let { newYs, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max } = this.fit(this.state.ys, id);
        this.setState({ ys,
            newYs, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max
        });
    }

    fit = (ys, n) => {
        let { state, iiMax, height, M, N } = this;
        let { i1i, i2i, width, dt } = state;
        let newYs = [];
        let id = 0;
        let [d1s, d2s, i1s, i2s] = [[], [], [], []];
        let [d1max, d2max, i1max, i2max] = [0, 0, 0, 0];

        let ids = Object.keys(ys);

        let i1 = -i1i * iiMax * height * width / 2;
        let i2 = -i2i * iiMax * height * (width / 2) ** 2;

        for (let jId = N; jId < ids.length - N; jId++) {
            let someIds = ids.slice(jId - N, jId + N + 1);
            let vector = new Array(M).fill(0);
            let matrix = [];
            for (let i = 0; i < M; i++) {
                matrix.push(new Array(M).fill(0));
            }
            for (const id2 of someIds) {
                for (let i = 0; i < M; i++) {
                    vector[i] += ys[id2] * id2 ** i;
                    for (let j = 0; j < M; j++) {
                        matrix[i][j] += id2 ** (i + j);
                    }
                }
            }
            const matrixInv = matrixInverse(matrix);
            const vecSol = new Array(M).fill(0);
            for (let i = 0; i < M; i++) {
                for (let j = 0; j < M; j++) {
                    vecSol[i] += matrixInv[i][j] * vector[j];
                }
            }
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
                newYs[id] = y;
                d1s[id] = d1;
                d2s[id] = d2;
                d1max = Math.max(d1max, Math.abs(d1));
                d2max = Math.max(d2max, Math.abs(d2));
                i1max = Math.max(i1max, Math.abs(i1));
                i2max = Math.max(i2max, Math.abs(i2));
                id++;
            }
        }
        return {newYs, d1s, d1max, d2s, d2max, i1s, i1max, i2s, i2max};
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLogN, handleInput, height } = this;
        let { ss, ys, i1s, d1s, d2s, i2s, width, dt, i1i, i2i, logN, avx, i1max, i2max, d1max, d2max, mousePressed } = state;
        return  !ss ? null : (
            <>
                <div>
                    <span>Show instructions</span>
                    <span>
                        <input
                            type="checkbox"
                            onChange={this.handleCheckbox}
                            name="showInstructions"
                            checked={this.state.showInstructions}
                        >
                        </input>
                    </span>
                </div>
                {!this.state.showInstructions ? null : <div>
                    <b>Instructions:</b>
                    <ul>
                        <li>Use the first slider to control the number of timesteps that will be used in the graphs.</li>
                        <li>Use the next slider to indicate what function (vs time <i>t</i>) you want to draw with your mouse: the <span className="a">acceleration (<i>a</i>)</span>, the <span className="v">velocity (<i>v</i>)</span>, or the <span className="x">position (<i>x</i>)</span>.</li>
                        <li>If needed, use the remaining slider(s) to specify qualitative value(s) for the initial conditions (ie, of <i className="v">v</i> and/or <i className="x">x</i>).</li>
                        <li> Click your mouse at a spot to the left of the rectangle and drag slowly to the right in order to create the graph for your chosen quantity.  (The dotted line represents zero.)</li>
                        <li>  The colors for the graphs of <i className="a">a</i>, <i className="v">v</i>, and <i className="x">x</i> will respectively be <span className="a">red</span>, <span className="v">green</span>, and <span className="x">blue.</span></li>
                    </ul>
                    <b>Notes</b>    :
                    <ul>
                        <li>If resolution is too fine or if dragged too quickly the mouse may miss one or more stripes in the DOM, in which case the app interpolates.</li>
                        <li>(Obviously) a derivative is rougher than the function itself.  (ie, <i className="a">a</i> is rougher than <i className="v">v</i> which is rougher than <i className="x">x</i>.) There are various ways that I may "smooth" this.</li>
                    </ul>
                </div>}
                <div className="sliders">
                    <div>
                        <div>Spatial resolution: </div>
                        <span>coarse</span>
                        <span>
                            <input
                                type="range"
                                onChange={handleLogN}
                                name="logN"
                                min="0.5"
                                max="3"
                                step="0.25"
                                value={logN}
                            />
                        </span>
                        <span>fine</span>
                    </div>
                    <div>
                        <div>Quantity being mouse-drawn (<i className="red">a</i>, <i className="v">v</i>, or <i className="x">x</i>): </div>
                        <span><i className="a">a</i></span>
                        <span>
                            <input
                                type="range"
                                onChange={handleInput}
                                name="avx"
                                min="0"
                                max="2"
                                step="1"
                                value={avx}
                            />
                        </span>
                        <span><i className="x">x</i></span>
                    </div>
                    {(avx > 1) ? null : <div>
                        <div>{(avx === 0) ? "velocity" : "position"}'s initial value (-, 0, or +): </div>
                        <span>negative</span>
                        <span>
                            <input
                                type="range"
                                onChange={handleInput}
                                name="i1i"
                                min="-1"
                                max="1"
                                step="1"
                                value={i1i}
                            />
                        </span>
                        <span>positive</span>
                    </div>}
                    {(avx > 0) ? null : <div>
                        <div>position's initial value (-, 0, or +): </div>
                        <span>negative</span>
                        <span>
                            <input
                                type="range"
                                onChange={handleInput}
                                name="i2i"
                                min="-1"
                                max="1"
                                step="1"
                                value={i2i}
                            />
                        </span>
                        <span>positive</span>
                    </div>}
                </div>
                <div className="strips-container" onMouseDown={handleDown} onMouseUp={handleUp}>
                    <div className="zero" style={{width: `${width}px`, top: `${Math.round(height/2)}px`}}></div>
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
                                {(ys[j] === undefined || ys[j + 1] === undefined || !mousePressed) ? null : <Bar
                                    key={`bar${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(ys[j] + height / 2)}
                                    y1={Math.round(ys[j + 1] + height / 2 )}
                                    color={this.colors[avx]}
                                />}
                                {(!state.newYs || state.newYs[j] === undefined || state.newYs[j + 1] === undefined || mousePressed) ? null : <Bar
                                    key={`newBar${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(state.newYs[j] + height / 2)}
                                    y1={Math.round(state.newYs[j + 1] + height / 2 )}
                                    color={this.colors[avx]}
                                />}
                                {(!d1s || d1s[j] === undefined || d1s[j + 1] === undefined) || avx < 1 ? null : <Bar
                                    key={`d1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d1s[j] *  height / 2 / d1max + height / 2)}
                                    y1={Math.round(d1s[j+1] *  height / 2 / d1max + height / 2)}
                                    color={this.colors[(avx + 2) % 3]}
                                />}
                                {(!i1s || i1s[j] === undefined || i1s[j + 1] === undefined) || avx > 1 ? null : <Bar
                                    key={`i1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(i1s[j] *  height / 2 / i1max + height / 2)}
                                    y1={Math.round(i1s[j+1] *  height / 2 / i1max + height / 2)}
                                    color={this.colors[(avx + 1) % 3]}
                                />}
                                {(!d2s || d2s[j] === undefined || d2s[j + 1] === undefined) || avx < 2 ? null : <Bar
                                    key={`d2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d2s[j] *  height / 2 / d2max + height / 2)}
                                    y1={Math.round(d2s[j+1] *  height / 2 / d2max + height / 2)}
                                    color={this.colors[(avx + 1) % 3]}
                                />}
                                {(!i2s || i2s[j] === undefined || i2s[j + 1] === undefined) || avx > 0 ? null : <Bar
                                    key={`i2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(i2s[j] *  height / 2 / i2max + height / 2)}
                                    y1={Math.round(i2s[j+1] *  height / 2 / i2max + height / 2)}
                                    color={this.colors[(avx + 2) % 3]}
                                />}
                            </>
                        ))}
                    </div>
                </div>
            </>
        )
    }
}

export default ThreeGraphs;
