import React from "react";
import LoadingSpinner from "../img/LoadingSpinner.gif";
import './Loading.css';

const Loading = () => {
  return (
    <div className="Loading">
      <img src={LoadingSpinner} alt="로딩 이미지" />
      <h3>잠시만 기다려주세요</h3>
    </div>
  );
};

export default Loading;