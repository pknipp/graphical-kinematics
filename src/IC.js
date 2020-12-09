import React from "react";

const IC = ({ name, quantity, handleInput, height }) => (
    <div className="IC" style={{height: `${height}px`}}>
        <input
            type="range"
            onChange={handleInput}
            name={`${name}`}
            min="-0.5"
            max="0.5"
            step="0.1"
            value={quantity}
            style={{
                width: `${height}px`,
                transformOrigin: `${height/2}px ${height/2}px`
            }}
        />
    </div>
)

export default IC;
