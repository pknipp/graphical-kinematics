import React from "react";
const Strip = ({ j, handleEnter, handleLeave, height, dt }) => {
    return (
        <div
            className="strip"
            key={`strip${j}`}
            id={j}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            style={{
                height:`${height}px`,
                left:`${j * dt}px`,
                width:`${dt}px`,
            }}
        >
        </div>
    )
}

export default Strip;
