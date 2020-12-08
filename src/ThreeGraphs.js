import React from "react";
import Strip from "./Strip";
import Bar from "./Bar";
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
        }
        this.height = 500;
        this.int = 0;
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
        let { imax, dmax, dt } = this.state;
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);

        let ys = id ? [...this.state.ys] : [null];
        // failing boolean means either that stripe was missed or mouse un-clicked
        if (!(this.state.mousePressed && id === ys.length - 1)) return;
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id, 0, y);

        let is = (id < 1) ? [] : [...this.state.is];
        let iy = (id < 1) ? this.int : is[id - 1] + (ys[id - 1] + ys[id]) * dt / 2;
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

        this.setState({ ys, is, ds, imax, dmax, ifac, dfac });
    }

    handleLeave = e => {
        let id = Number(e.target.id) //+ ((e.target.leave) ? 1 : 0);
        let ys = [...this.state.ys];
        // Last boolean means that this only works when leaving the last stripe.
        if (!(this.state.mousePressed && id === this.state.n - 1 && id === ys.length - 2)) return
        let y = e.nativeEvent.offsetY - this.height / 2;
        ys.splice(id + 1, 0, y);
        this.setState({ ys });
    }

    render() {
        let { state, handleDown, handleUp, handleEnter, handleLeave, height } = this;
        let {n, ys, is, ds, width, dt, ifac, dfac} = state;
        return  !ys ? null : (
            <>
                <div>
                    Instructions: Click mouse at a stop to the left of the graph and drag it slowly to the right in order    to create the graph of a function    (in    blue).  The dotted line represents zero.  The    definite integral (assuming zero initial conditions) will appear in    red, and  the   derivative will appear in green.  I use very simple formulas
                    for calculating integral and derivative.
                </div>
                <div>
                    Known bugs:
                    <ul>
                        <li>(Blue) function will stop rendering if resolution is too fine or if dragged too quickly.  (This happens when the mouse misses a virtual stripe in the DOM.)  I can hack a solution for this in various ways (interpolation?).</li>
                        <li>(Obviously) the derivative is rougher than the function itself.  There are various ways that I may "smooth" this.</li>
                    </ul>
                </div>
                <div>
                    To-do list (other than those items mentionned above):
                    <ul>
                        <li>Calculate 2nd derivative (ie, position -> acceleration) and "2nd integral" (ie, acceleration -> displacement).</li>
                        <li>At present the integration assumes the initial value to be zero.  I can place 1 or 2 vertical slider(s) next to the graph in order to allow the user to adjust this, both for the "1st integral" and "2nd integral."  For instance this would be like setting the values of the initial position and velocity, if the acceleration is drawn.</li>
                        <li>Allow the user to specify whether he/she is drawing the position, the velocity, or the acceleration.  The other two functions would then get generated.</li>
                        <li>I should be able to include one more point at the end of the derivative graph.</li>
                        <li>My inclination is to keep this qualitative rather than quantitative (ie, NOT putting numbers along either axis).</li>
                        <li>Get VALUED feedback from colleagues, before taking the next step(s)!</li>
                    </ul>
                </div>
                <div>
                    <div>Spatial resolution: </div>
                    <span>coarse</span>
                    <span>
                        <input
                            type="range"
                            onChange={this.handleLogN}
                            name="logN"
                            min="0.25"
                            max="3"
                            step="0.25"
                            value={this.state.logN}
                        />
                    </span>
                    <span>fine</span>
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
                                {!(j < ys.length - 3 && j < n) ? null : <Bar
                                    key={`int${j}`}
                                    j={j}
                                    offset={0} //{Math.round(dt/2)}
                                    dt={dt}
                                    y={Math.round(is[j] * ifac + this.height / 2)}
                                    y1={Math.round(is[j + 1] * ifac + this.height / 2 )}
                                    color={"red"}
                                />}
                                {!(j < ys.length - 3 && j < n - 1) ? null : <Bar
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
