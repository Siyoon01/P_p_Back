import React, { useState } from "react";
import './FindAccount01.css';
import { useNavigate } from 'react-router-dom';

function FindAccount01() {
  const [name, setName] = useState('');
  const [btd, setBtd] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foundInfo, setFoundInfo] = useState({ name: '', userID: '' }); 

  const navigate = useNavigate();

  // 생년월일 유효성 검증 함수
  const validateBirthdate = (value) => {
    // 숫자만 입력 가능
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 6) return numericValue.slice(0, 6);
    
    // 6자리 미만이면 그대로 반환
    if (numericValue.length < 6) return numericValue;
    
    // 6자리인 경우 MM과 DD 검증
    const mm = parseInt(numericValue.substring(2, 4), 10);
    const dd = parseInt(numericValue.substring(4, 6), 10);
    
    // MM이 01~12 범위를 벗어나면 마지막 입력 무시
    if (mm < 1 || mm > 12) {
      return numericValue.slice(0, 4); // YYMM까지만 유지
    }
    
    // DD가 01~31 범위를 벗어나면 마지막 입력 무시
    if (dd < 1 || dd > 31) {
      return numericValue.slice(0, 5); // YYMMD까지만 유지
    }
    
    return numericValue;
  };

  const handleBirthdateChange = (e) => {
    const validatedValue = validateBirthdate(e.target.value);
    setBtd(validatedValue);
  };

  const handleFindId = async (e) => {
    e.preventDefault();

    // 생년월일 유효성 검증
    if (btd.length !== 6) {
      alert("생년월일은 6자리(YYMMDD)로 입력해주세요.");
      return;
    }
    const mm = parseInt(btd.substring(2, 4), 10);
    const dd = parseInt(btd.substring(4, 6), 10);
    if (mm < 1 || mm > 12) {
      alert("월(MM)은 01~12 사이의 값이어야 합니다.");
      return;
    }
    if (dd < 1 || dd > 31) {
      alert("일(DD)은 01~31 사이의 값이어야 합니다.");
      return;
    }

    console.log('아이디 찾기 시도:', { name, btd });

    try {
      const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/find-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: name,
          birthdate: btd,
        }),
      });

      const data = await res.json(); 
      console.log('아이디 찾기 응답:', data);

      if (res.ok) {
        // 백엔드 응답: { success: true, data: { userID: '...', userId: '...' } }
        const foundUserId = data.data?.userID || data.data?.userId || '';
        if (!foundUserId) {
          console.error('아이디 찾기 응답에 userID가 없음:', data);
          alert('아이디를 찾을 수 없습니다.');
          return;
        }
        setFoundInfo({ name: name, userID: foundUserId });
        setIsModalOpen(true);
      } else { 
        console.error('아이디 찾기 실패:', data);
        alert(data.message || '아이디 찾기 실패'); 
      }
    } catch (error) {
      console.error('아이디 찾기 API 호출 중 오류 발생:', error);
      alert(error.message || '서버와 통신하는 중 문제가 발생했습니다.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const goToLogin = () => {
    closeModal();
    navigate('/Userlogin'); // 로그인 페이지로 이동
  };

  return (
    <>
      <section className="logincontainer">
        <h3>아이디를 찾고 싶다면 하단에 이름과 생년월일을 입력해주세요.</h3>

        <form onSubmit={handleFindId}>
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            autoFocus
          />
          <label htmlFor="btd">생년월일(6자리)</label>
          <input
            id="btd"
            type="text"
            value={btd}
            inputMode="numeric"
            maxLength="6"
            onChange={handleBirthdateChange}
            placeholder="YYMMDD"
            pattern="\d{6}"
            required
          />
          <div className="button-container">
            <button type="submit" className="find-id">아이디 찾기</button>
          </div>
        </form>

        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="find-modal-content" onClick={e => e.stopPropagation()}>
              <h2>아이디 찾기</h2>
              <h3>{foundInfo.name}님의 아이디 찾기가 완료되었습니다.</h3>
              <h3>아이디는 {foundInfo.userID} 입니다.</h3>

              <button className="move-to-Userlogin" onClick={goToLogin}>
                로그인 페이지로 이동하기
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default FindAccount01;