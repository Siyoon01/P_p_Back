import React from "react";
import "./Stage.css"

function Stage({currentstage}) {
  const stages = ["회원가입", "정보 등록", "재료 등록"];

  return (
    <div className="stagecontainer">
      <div className="stageindicator">
        {stages.map((label, index) => (
          <React.Fragment key={index}>
            <div className={"stage" + (currentstage === index + 1 ? " active" : "")}>
              {index + 1}
            </div>
            {index < stages.length - 1 && <div className="arrow">→</div>}
          </React.Fragment>
        ))}
      </div>

      <div className="stage-labels">
        {stages.map((label, index) => (
          <span
            key={index}
            className = { currentstage === index + 1 ? "active-label" : "" }
            >
              {label}
              </span>
        ))}
      </div>
    </div>
  );
}

export default Stage;