import React from "react";
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
            ys: [null],
            i1s: [0],
            d1s:[0],
            i2s: [0],
            d2s: [0],
            i2max: 0,
            d1max: 0,
            d2max: 0,
            i1i: 0.0,
            i2i: 0.0,
            xva: 1,
        }
        this.height = 500;
        this.i1iMax = 0.3;
        this.i2iMax = 0.3;
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

    handleInput = e => {
        this.setState({[e.target.name]: Number(e.target.value)});
    }
    handleCheckbox = e => this.setState({[e.target.name]: e.target.checked});
    handleToggle = e => this.setState({[e.target.name]: e.target.checked});
    handleDown = _ => this.setState({ mousePressed: true });
    handleUp   = _ => this.setState({ mousePressed: false});
    handleEnter = e => {
        let { d1max, dt, i1i, width } = this.state;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = id ? [...this.state.ys] : [null];
        // following line is needed if previous run shutdown improperly, I think
        d1max = (!id) ? 0 : d1max;
        // failing boolean means either that stripe was missed or mouse un-clicked
        if (!(this.state.mousePressed && id === ys.length - 1)) return;
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id, 0, y);

        let i1s = (id === 0) ? [0] : [...this.state.i1s];
        let myI1i = (i1i > 0) ? this.i1iMax: (i1i < 0) ? -this.i1iMax : 0;
        let i1y = (id < 1) ? - myI1i * this.height * width / 2 : i1s[id - 1] + (ys[id - 1] + ys[id]) * dt / 2;
        i1s.splice(id, 0, i1y);
        i1s[i1s.length - 1] = Math.max(i1s[i1s.length - 1], i1y, -i1y);
        // i1max = Math.max(i1max, i1y, -i1y);
        // let i1fac = this.height/2/i1max;
        let i1fac = this.height/2/i1s[i1s.length - 1];

        let d1s = (id < 1) ? [] : [...this.state.d1s];
        let d1y;
        if (id === 1) {
            d1y = (ys[id] - ys[id - 1]) / dt;
            d1s.push(d1y, d1y);
        }
        if (id === 2) {
            d1y = (ys[2] - ys[1]) / dt;
            d1s[0] = 3 * (ys[1] - ys[0])/ dt / 2 - d1y / 2;
            d1s[1] = d1y;
            d1max = Math.max(d1max, d1s[0], -d1s[0], d1s[1], -d1s[1]);
        }
        if (id > 2) {
            d1y = (ys[id] - ys[id - 2]) / 2 / dt;
            d1s.push(d1y);
            d1max = Math.max(d1max, d1y, -d1y);
        }
        let d1fac = this.height/2/d1max;
        // console.log(id, imax, ifac);
        this.setState({ ys, i1s, d1s, d1max, i1fac, d1fac });
    }

    handleLeave = e => {
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let { d1max, dt, mousePressed, n } = this.state;
        let ys = [...this.state.ys];
        let i1s = [...this.state.i1s];
        let d1s = [...this.state.d1s];
        // Last boolean means that this only works when leaving the last stripe.
        if (!(mousePressed && id === n - 1 && id === ys.length - 2)) return
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id + 1, 0, y);
        let i1y = i1s[id] + (ys[id] + ys[id + 1]) * dt / 2;
        // i1s.push(i1y);
        i1s.splice(id + 1, 0, i1y);
        // i1max = Math.max(i1max, i1y, -i1y);
        i1s[i1s.length - 1] = Math.max(i1s[i1s.length - 1], i1y, -i1y)
        let i1fac = this.height/2/i1s[i1s.length - 1];

        let d1y = (ys[id + 1] - ys[id - 1]) / 2 / dt;
        d1s.push(d1y);

        d1s.push(2 * (ys[id + 1] - ys[id])/ dt - d1y);
        d1max = Math.max(d1max, Math.abs(d1y), Math.abs(d1s[id + 1]));
        let d1fac = this.height/2/d1max;
        this.setState({ ys, i1s, d1s, i1fac, d1fac });
    }

    getInt = id => {
        let { ys, i1max, dt, i1i, width } = this.state;
        let i1s = (id < 1) ? [] : [...this.state.i1s];
        let myI1i = (i1i > 0) ? this.i1iMax: (i1i < 0) ? -this.i1iMax : 0;
        let i1y = (id < 1) ? - myI1i * this.height * width / 2 : i1s[id - 1] + (ys[id - 1] + ys[id]) * dt / 2;
        i1max = Math.max(i1max, i1y, -i1y);
        i1s.push(i1y);
        let i1fac = this.height/2/i1max;
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLeave, handleLogN, handleInput, height } = this;
        let {n, ys, i1s, d1s, width, dt, i1i, i1fac, d1fac, logN} = state;
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
                        <div>Integral's initial value (-, 0, or +): </div>
                        <span>negative</span>
                        <span>
                            <input
                                type="range"
                                onChange={handleInput}
                                name="i1i"
                                min="-0.5"
                                max="0.5"
                                step="0.5"
                                value={i1i}
                            />
                        </span>
                        <span>positive</span>
                    </div>
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
                                    offset={0}
                                    dt={dt}
                                    y={Math.round(y + this.height / 2)}
                                    y1={Math.round(ys[j + 1] + this.height / 2 )}
                                    color={"blue"}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`int${j}`}
                                    j={j}
                                    offset={0} //{Math.round(dt/2)}
                                    dt={dt}
                                    y={Math.round(i1s[j] * i1fac + this.height / 2)}
                                    y1={Math.round(i1s[j + 1] * i1fac + this.height / 2 )}
                                    color={"red"}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`der${j}`}
                                    j={j}
                                    offset={0}
                                    dt={dt}
                                    y={Math.round(d1s[j] * d1fac + this.height / 2)}
                                    y1={Math.round(d1s[j + 1] * d1fac + this.height / 2 )}
                                    color={"green"}
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
