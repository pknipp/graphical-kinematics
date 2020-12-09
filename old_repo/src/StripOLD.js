import React from "react";
import Bar from "./Bar";
const Strip = ({ j, handleMouseLeave, y, height, dx }) => {
    return (
        <div
            className="strip"
            key={`strip${j}`}
            id={j}
            onMouseLeave={handleMouseLeave}
            style={{
                height:`${height}px`,
                width:`${dx}px`
            }}
        >
            <Bar key={`bar${j}`} className="bar" y={y} dx={dx} />
        </div>
    )
}

export default Strip;
