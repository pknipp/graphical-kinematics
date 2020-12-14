import React from "react";
import Strip from "./Strip";
import Bar from "./Bar";
// import IC from "./IC";
class ThreeGraphs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logN: 1.5,
            width: 1000,
            mousePressed: false,
            ys: [null],
            i1s: [0],
            d1s:[0],
            i2s: [0],
            d2s: [0],
            i1i: 0.0,
            i2i: 0.0,
            avx: 1,
        }
        this.height = 500;
        this.iiMax = 0.3;
    }

    componentDidMount() {
        let n = Math.round(10 ** this.state.logN);
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        this.setState({ n, dt, width });
    }

    handleLogN = e => {
        let logN = Number(e.target.value);
        let n = Math.round(10 ** logN);
        let dt = Math.round(this.state.width / n);
        let width = n * dt;
        this.setState({ logN, n, dt, width });
    }

    handleInput = e => this.setState({[e.target.name]: Number(e.target.value)});
    handleCheckbox = e => this.setState({[e.target.name]: e.target.checked});
    handleToggle = e => this.setState({[e.target.name]: e.target.checked});
    handleDown = _ => this.setState({ mousePressed: true });
    handleUp   = _ => this.setState({ mousePressed: false});
    handleEnter = e => {
        let { state, height, getInt, getDer } = this;
        let { mousePressed, i1i, i2i } = state;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = id ? [...state.ys] : [null];
        // failing boolean means either that stripe was missed or mouse un-clicked
        if (!(mousePressed && id === ys.length - 1)) return;
        let y = e.nativeEvent.offsetY - height / 2;
        ys.splice(id, 0, y);
        // following two lines evaluate the function's 1st and 2nd definite integrals
        let i1s = getInt(id, ys, state.i1s, i1i, 1);
        let i2s = getInt(id, i1s,state.i2s, i2i, 2);
        // following two lines evaluate the function's 1st and 2nd derivatives
        let d1s = getDer(id, ys, state.d1s);
        let d2s = getDer(id - ((id === 1) ? 0 : 1), d1s, state.d2s);

        this.setState({ ys, i1s, d1s, i2s, d2s });
    }

    handleLeave = e => {
        let { state, height, getInt, getDer } = this;
        let { mousePressed, n } = state;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = [...state.ys];
        // Last boolean means that this only handles when leaving the last stripe.
        if (!(mousePressed && id === n - 1 && id === ys.length - 2)) return
        let y = e.nativeEvent.offsetY - height / 2;
        ys.splice(n, 0, y);

        let i1s = getInt(n, ys, state.i1s);
        let i2s = getInt(n, i1s,state.i2s);
        let d1s = getDer(n, ys, state.d1s);
        let d2s = getDer(n - 1, d1s, state.d2s);
        d2s = getDer(n, d1s, d2s);

        this.setState({ ys, i1s, d1s, i2s, d2s });
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
        let {n, ys, i1s, d1s, d2s, i2s, width, dt, i1i, i2i, logN, avx} = state;
        return  !ys ? null : (
            <>
                <div>
                    <b>Instructions:</b> Click mouse at a spot to the left of the rectangle and drag slowly to the right in order to create the graph of a function (blue).  The dotted line represents zero.  The indefinite integral (for user-controlled "initial conditions" which are either positive, negative, or zero) will appear as red, and  the derivative will be green.  I use simple formulas
                    for calculating integral and derivative.
                </div>
                <div>
                    <b>Bugs</b> (which are known):
                    <ul>
                        <li>If resolution is too fine or if dragged too quickly, app ceases because the mouse misses a virtual stripe in the DOM.  I can hack a solution for this via interpolation.</li>
                        <li>(Obviously) the derivative is rougher than the function itself.  There are various ways that I may "smooth" this.</li>
                    </ul>
                </div>
                <div>
                    <b>To-do</b> list (other than those items mentionned above):
                    <ul>
                        <li>Make the "language" of this specific to kinematics, ie for independent variable being the time <i>t</i> and dependent variables being the position <i>x</i>, velocity <i>v</i>, and acceleration <i>a</i>.</li>
                        <li>Allow the user to specify whether he/she is drawing <i>x</i>, <i>v</i>, or <i>a</i>.  The other two functions would then get generated automatically.</li>
                        <li>My inclination is to keep this qualitative rather than quantitative (ie, NOT putting numbers along either axis).</li>
                    </ul>
                </div>
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
                        <div>Quantity being mouse-drawn (a, v, or x): </div>
                        <span>a</span>
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
                        <span>x</span>
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
                        {ys.map((y, j, ys) => (
                            <>
                                {!(j < n) ? null : <Strip key={`strip${j}`}
                                    j={j}
                                    height={height}
                                    y={y}
                                    dt={dt}
                                    handleEnter={handleEnter}
                                    handleLeave={handleLeave}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`bar${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(y + height / 2)}
                                    y1={Math.round(ys[j + 1] + height / 2 )}
                                    color={"blue"}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`i1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(height * (i1s[j] / i1s[i1s.length - 1] + 1) / 2)}
                                    y1={Math.round(height * (i1s[j + 1] / i1s[i1s.length - 1] + 1) / 2 )}
                                    color={"red"}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`i2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(i2s[j] * height/2/i2s[i2s.length - 1] + height / 2)}
                                    y1={Math.round(i2s[j + 1] * height/2/i2s[i2s.length - 1] + height / 2 )}
                                    color={"orange"}
                                />}
                                {!((j < ys.length - 3) && j < n) ? null : <Bar
                                    key={`d1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d1s[j] *  height/2/d1s[d1s.length-1]+height/2)}
                                    y1={Math.round(d1s[j+1]*height/2/d1s[d1s.length-1]+height/2)}
                                    color={"green"}
                                />}
                                {(j !== n - 1) ? null : <Bar
                                    key={`d1${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d1s[j] * height/2/d1s[d1s.length - 1] + height / 2)}
                                    y1={Math.round(d1s[j + 1]*height/2/d1s[d1s.length-1] + height / 2 )}
                                    color={"green"}
                                />}
                                {!((j < ys.length - 4) && j < n) ? null : <Bar
                                    key={`d2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d2s[j] * height/2/d2s[d2s.length - 1] + height / 2)}
                                    y1={Math.round(d2s[j + 1]*height/2/d2s[d2s.length-1] + height / 2 )}
                                    color={"purple"}
                                />}
                                {(j!== n - 2 && j !== n - 1) ? null : <Bar
                                    key={`d2${j}`}
                                    j={j}
                                    dt={dt}
                                    y={Math.round(d2s[j] * height/2/d2s[d2s.length - 1] + height / 2)}
                                    y1={Math.round(d2s[j + 1]*height/2/d2s[d2s.length-1] + height / 2 )}
                                    color={"purple"}
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
