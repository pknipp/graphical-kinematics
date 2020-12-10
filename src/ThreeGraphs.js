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
            is: [],
            ds:[],
            imax: 0,
            dmax: 0,
            xi: 0.0,
        }
        this.height = 500;
        this.xiMax = 0.3;
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
        let { imax, dmax, dt, xi, width } = this.state;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = id ? [...this.state.ys] : [null];
        // following two lines are needed if previous run shutdown improperly, I think
        imax = (!id) ? 0 : imax;
        dmax = (!id) ? 0 : dmax;
        // failing boolean means either that stripe was missed or mouse un-clicked
        if (!(this.state.mousePressed && id === ys.length - 1)) return;
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id, 0, y);

        let is = (id < 1) ? [] : [...this.state.is];
        let myXi = (xi > 0) ? this.xiMax: (xi < 0) ? -this.xiMax : 0;
        let iy = (id < 1) ? - myXi * this.height * width / 2 : is[id - 1] + (ys[id - 1] + ys[id]) * dt / 2;
        imax = Math.max(imax, iy, -iy);
        is.push(iy);
        let ifac = this.height/2/imax;

        let ds = (id < 1) ? [] : [...this.state.ds];
        let dy;
        if (id === 1) {
            dy = (ys[id] - ys[id - 1]) / dt;
            ds.push(dy, dy);
        }
        if (id === 2) {
            dy = (ys[2] - ys[1]) / dt;
            ds[0] = 3 * (ys[1] - ys[0])/ dt / 2 - dy / 2;
            ds[1] = dy;
            dmax = Math.max(dmax, ds[0], -ds[0], ds[1], -ds[1]);
        }
        if (id > 2) {
            dy = (ys[id] - ys[id - 2]) / 2 / dt;
            ds.push(dy);
            dmax = Math.max(dmax, dy, -dy);
        }
        let dfac = this.height/2/dmax;
        // console.log(id, imax, ifac);
        this.setState({ ys, is, ds, imax, dmax, ifac, dfac });
    }

    handleLeave = e => {
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let { imax, dmax, dt, mousePressed, n } = this.state;
        let ys = [...this.state.ys];
        let is = [...this.state.is];
        let ds = [...this.state.ds];
        // Last boolean means that this only works when leaving the last stripe.
        if (!(mousePressed && id === n - 1 && id === ys.length - 2)) return
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id + 1, 0, y);
        let iy = is[id] + (ys[id] + ys[id + 1]) * dt / 2;
        imax = Math.max(imax, iy, -iy);
        is.push(iy);
        let ifac = this.height/2/imax;
        let dy = (ys[id + 1] - ys[id - 1]) / 2 / dt;
        ds.push(dy);

        ds.push(2 * (ys[id + 1] - ys[id])/ dt - dy);
        dmax = Math.max(dmax, Math.abs(dy), Math.abs(ds[id + 1]));
        let dfac = this.height/2/dmax;
        this.setState({ ys, is, ds, ifac, dfac });
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLeave, handleLogN, handleInput, height } = this;
        let {n, ys, is, ds, width, dt, xi, ifac, dfac, logN} = state;
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
                                name="xi"
                                min="-0.5"
                                max="0.5"
                                step="0.5"
                                value={xi}
                            />
                        </span>
                        <span>positive</span>
                    </div>
                </div>
                <div className="strips-container" onMouseDown={handleDown} onMouseUp={handleUp}>

                    {/* <IC
                        quantity={xi}
                        handleInput={this.handleInput}
                        height={this.height}
                        name="xi"
                    />
                    <div className="spacer" style={{height: `${height}px`}}></div> */}

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
                                    y={Math.round(is[j] * ifac + this.height / 2)}
                                    y1={Math.round(is[j + 1] * ifac + this.height / 2 )}
                                    color={"red"}
                                />}
                                {!(j < ys.length - 2 && j < n) ? null : <Bar
                                    key={`der${j}`}
                                    j={j}
                                    offset={0}
                                    dt={dt}
                                    y={Math.round(ds[j] * dfac + this.height / 2)}
                                    y1={Math.round(ds[j + 1] * dfac + this.height / 2 )}
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
