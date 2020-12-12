import React from "react";
const Bar = ({ j, dt, y, y1, color }) => {
    let t = j * dt;
    let dy = y1 - y;
    let r = Math.sqrt(dt * dt + dy * dy);
    let angle = Math.atan2(dy, dt) * 180 / Math.PI;
    return (
        <div className="segment"
        style={{
            width:`${r}px`,
            left: `${t - r / 2}px`,
            top: `${y}px`,
            transform: `rotate(${angle}deg) translateX(${r / 2}px)`,
            borderColor: `${color}`
        }}
        >
        </div>
    )
}
export default Bar;
