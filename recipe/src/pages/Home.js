/* 비로그인 상태의 메인 페이지 */
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import book from '../img/book.png';
import bell from '../img/yellow bell.png';
import camera from '../img/yellow camera.png';
import ingredients from '../img/ingredients.png';

function Home() {
  return (
    <main className="Maincontent">
    <section className="Introduce">
      <div className="intro">
        <p>
          나의 식재료, 알레르기, 조리도구까지.<br />
          나만을 위한 AI 셰프가 최고의 레시피를 찾아드립니다.<br />
          사진 촬영 한 번으로 끝내는 '오늘 뭐 먹지?'<br /> 고민은 이제 끝!<br />
          유통기한마저 고려해줘 버릴까 말까 <br />망설이는 고민도 이제 그만!<br />
          AI와 함께 당신의 냉장고를 가장 맛있게 비우는 방법을 찾아보세요.
        </p>
      </div>
      <div className="imagecontent">
        <img src={ingredients} alt="재료가 있는 냉장고 이미지" />
      </div>
    </section>
    <p className="featuretitle">주요 기능</p>
    <section className="feature">
      <div className="feature-items-wrapper">
        <article className="feature-item">
            <img src={camera} alt="재료 등록 아이콘" />
            <h3>재료 등록</h3>
            <p>재료 사진을 찍어 등록하거나 수기로 직접 등록할 수 <br />있어요</p>
          </article>
          <article className="feature-item">
            <img src={book} alt="레시피 추천 아이콘" />
            <h3>레시피 추천</h3>
            <p>AI를 통해 사용자가 등록한 <br />재료와 알레르기,  <br />조리도구까지 반영해 <br />추천해요</p>
          </article>
          <article className="feature-item">
            <img src={bell} alt="임박 재료 알림 아이콘" />
            <h3>임박 재료 알림</h3>
            <p>재료 소비 기한이 임박한 <br />재료가 있을 때 알려줘요</p>
          </article>
        </div>
    </section>
    <section className="user-flow">
        <h3>단계별 서비스 이용 과정을 살펴보세요</h3>
        <div className="steps">
          <div className="step-circle">회원가입</div>
          <div className="step-arrow">→</div>
          <div className="step-circle">개인 맞춤 <br />정보 등록</div>
          <div className="step-arrow">→</div>
          <div className="step-circle">재료 등록</div>
        </div>
      </section>
      <Link to="/Register" className="start-button">시작하기</Link>
    </main>
  );
}

export default Home;