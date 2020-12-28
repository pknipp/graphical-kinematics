import React from "react";
import Strip from "./Strip";
import Bar from "./Bar";
// import IC from "./IC";
class ThreeGraphs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logN: 1.25,
            width: 1000,
            mousePressed: false,
            ys: [],
            i1s: [0],
            d1s:[0],
            i2s: [0],
            d2s: [0],
            i1i: 0,
            i2i: 0,
            avx: 2,
            id: -1,
            showInstructions: true,
        }
        this.height = 500;
        this.iiMax = 0.3;
        this.colors = ["red", "green", "blue"];
    }

    componentDidMount() {
        let n = Math.round(10 ** this.state.logN);
        let ss= new Array(n).fill(null);
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        this.setState({ n, dt, width, ss });
    }

    handleLogN = e => {
        let logN = Number(e.target.value);
        let n = Math.round(10 ** logN);
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        let ss = new Array(n).fill(null);
        this.setState({ logN, n, dt, width, ss });
    }

    handleInput = e => this.setState({[e.target.name]: Number(e.target.value)});
    handleCheckbox = e => this.setState({[e.target.name]: e.target.checked});
    handleToggle = e => this.setState({[e.target.name]: e.target.checked});
    handleDown = e => {
        e.preventDefault();
        this.setState({ mousePressed: true, ys: [], i1s: [0], i2s: [0], d1s: [0], d2s: [0] });
    }
    handleUp   = e => {
        e.preventDefault();
        this.setState({ mousePressed: false,
        //  d2s: this.smooth(this.state.d2s, 5)
        });
    };

    handleEnter = e => {
        e.preventDefault();
        let { state, height, getInt, getDer } = this;
        let { mousePressed, i1i, i2i, avx } = state;
        console.log("top of handleEnter", mousePressed);
        if (!mousePressed) return;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys =  [...state.ys];
        let i1s = [...state.i1s];
        let i2s = [...state.i2s];
        let d1s = [...state.d1s];
        let d2s = [...state.d2s];
        let y3 = e.nativeEvent.offsetY - height / 2;
        let c1, c2, c3;
        let id2 = ys.length - 1;
        let id1 = id2 - 1;
        if (id2 > 0) {
            c1 = ys[id1] / (id - id1);
            c2 = ys[id2] / (id2 - id);
            c3 = y3 / (id - id1) / (id - id2);
        }
        for (let j = ys.length; j <= id; j++) {
            if (j < 2 && id !== j) return;
            // Use quadratic interpolation unless at first two points
            ys.push((j < 2) ? y3 : c1*(j-id2)*(j-id)+c2*(j-id1)*(j-id)+c3*(j-id1)*(j-id2));
            // following two lines evaluate the function's 1st and 2nd definite integrals
            if (avx < 2) i1s = getInt(j, ys, i1s, i1i, 1);
            if (avx < 1) i2s = getInt(j, i1s,i2s, i2i, 2);
            // following two lines evaluate the function's 1st and 2nd derivatives
            if (avx > 0) d1s = getDer(j, ys, d1s);
            if (avx > 1) d2s = getDer(j - ((id === 1) ? 0 : 1), d1s, d2s);
        }
        this.setState({ ys, i1s, d1s, i2s, d2s, id });
    }

    handleLeave = e => {
        e.preventDefault();
        let { state, height, getInt, getDer } = this;
        let { mousePressed, n, avx } = state;
        let i1s = [...state.i1s];
        let i2s = [...state.i2s];
        let d1s = [...state.d1s];
        let d2s = [...state.d2s];
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = [...state.ys];
        // Last boolean means that this only handles when leaving the last stripe.
        if (!(mousePressed && id === n - 1 && id === ys.length - 1)) return;
        let y = e.nativeEvent.offsetY - height / 2;
        ys.push(y);

        if (avx < 2) i1s = getInt(n, ys, state.i1s);
        if (avx < 1) i2s = getInt(n, i1s,state.i2s);
        if (avx > 0) d1s = getDer(n, ys, state.d1s);
        if (avx > 1) {
            d2s = getDer(n - 1, d1s, state.d2s);
            d2s = getDer(n, d1s, d2s);
        }
        this.setState({ ys, i1s, d1s, i2s, d2s });
    }

    smooth = (fsOld, n) => {
        let fsMax = 0;
        let fs = [...fsOld].slice(0, -1);
        for (let j = n; j < fs.length - n; j++) {
            fs[j] = fsOld.slice(j - n, j + n + 1).sort()[n];
            fsMax = Math.max(fsMax, Math.abs(fs[j]));
        }
        fs.push(fsMax)
        return fs;
    }

    getInt = (id, fs, isOld, ii, order) => {
        let is = [...isOld];
        let { iiMax, state, height } = this;
        let { dt, width } = state;
        let myIi = (ii > 0) ? iiMax: (ii < 0) ? -iiMax : 0;
        let iy = (id < 1) ? - myIi * height * (width / 2) ** order :
             is[id - 1] + (fs[id - 1] + fs[id]) * dt / 2;
        is.splice(id, 0, iy);
        is[is.length - 1] = Math.max(is[is.length - 1], iy, -iy);
        return is;
    }

    getDer = (id, fs, dsOld) => {
        let ds = [...dsOld];
        let { n, dt } = this.state;
        let dy;
        if (id === 1) {
            dy = (fs[id] - fs[id - 1]) / dt;
            ds = [dy, dy, Math.abs(dy)];
        } else if (id === 2) {
            dy = (fs[2] - fs[0]) / 2 / dt;
            ds[0] = 2 * (fs[1] - fs[0])/ dt - dy;
            ds[1] = dy;
            ds[2] = Math.max(Math.abs(ds[0]), Math.abs(ds[1]));
        } else if (id > 2 && id < n) {
            dy = (fs[id] - fs[id - 2]) / 2 / dt;
            ds.splice(id - 1, 0, dy);
            ds[ds.length - 1] = Math.max(ds[ds.length - 1], dy, -dy);
        } else if (id === n) {
            dy = (fs[n] - fs[n - 2]) / 2 / dt;
            ds.splice(n - 1, 0, dy);
            ds.splice(n, 0, 2 * (fs[n] - fs[n - 1])/ dt - dy);
            ds[n + 1] = Math.max(ds[n + 1], Math.abs(dy), Math.abs(ds[n]));
        }
        return ds;
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLeave, handleLogN, handleInput, height } = this;
        let {n, ss, ys, i1s, d1s, d2s, i2s, width, dt, i1i, i2i, logN, avx} = state;
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
                                {!(j < n) ? null : <Strip key={`strip${j}`}
                                    j={j}
                                    height={height}
                                    dt={dt}
                                    handleEnter={handleEnter}
                                    handleLeave={handleLeave}
                                />}
                                {(j > ys.length - 2 || j > n - 1) ? null : <Bar
                                    key={`bar${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(ys[j] + height / 2)}
                                    y1={Math.round(ys[j + 1] + height / 2 )}
                                    color={this.colors[avx]}
                                />}
                                {(j > ys.length - 2 || j > n - 1 || avx > 1) ? null : <Bar
                                    key={`i1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(height * (i1s[j] / i1s[i1s.length - 1] + 1) / 2)}
                                    y1={Math.round(height * (i1s[j + 1] / i1s[i1s.length - 1] + 1) / 2 )}
                                    color={this.colors[(avx + 1) % 3]}
                                />}
                                {(j > ys.length - 2 || j > n - 1 || avx > 0) ? null : <Bar
                                    key={`i2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(i2s[j] * height/2/i2s[i2s.length - 1] + height / 2)}
                                    y1={Math.round(i2s[j + 1] * height/2/i2s[i2s.length - 1] + height / 2 )}
                                    color={this.colors[(avx + 2) % 3]}
                                />}
                                {(j > ys.length - 3 || j > n - 1 || avx < 1) ? null : <Bar
                                    key={`d1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d1s[j] *  height/2/d1s[d1s.length-1]+height/2)}
                                    y1={Math.round(d1s[j+1]*height/2/d1s[d1s.length-1]+height/2)}
                                    color={this.colors[(avx + 2) % 3]}
                                />}
                                {(j !== n - 1 || avx < 1) ? null : <Bar
                                    key={`d1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d1s[j] * height/2/d1s[d1s.length - 1] + height / 2)}
                                    y1={Math.round(d1s[j + 1]*height/2/d1s[d1s.length-1] + height / 2 )}
                                    color={this.colors[(avx + 2) % 3]}
                                />}
                                {((j > ys.length - 4) || j > n - 1 || avx < 2) ? null : <Bar
                                    key={`d2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d2s[j] * height/2/d2s[d2s.length - 1] + height / 2)}
                                    y1={Math.round(d2s[j + 1]*height/2/d2s[d2s.length-1] + height / 2 )}
                                    color={this.colors[(avx + 1) % 3]}
                                />}
                                {(!(j === n - 2 || j === n - 1) || avx < 2) ? null : <Bar
                                    key={`d2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d2s[j] * height/2/d2s[d2s.length - 1] + height / 2)}
                                    y1={Math.round(d2s[j + 1]*height/2/d2s[d2s.length-1] + height / 2 )}
                                    color={this.colors[(avx + 1) % 3]}
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
