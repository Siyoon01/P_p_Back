import React, { useState } from "react";
import './FindAccount02.css';
import { useNavigate } from 'react-router-dom';

function FindAccount02() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [btd, setBtd] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState(''); 

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

    console.log('비밀번호 재설정 시도:', { name, username, btd });

    try {
      const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/verify-reset-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: name, //이름
          userId: username, //id
          birthdate: btd, //생년월일
        }),
      });

      const data = await res.json(); 

      if (res.ok) {
        // resetToken 저장
        setResetToken(data.data.resetToken);
        setIsModalOpen(true);
      } else { 
        alert(data.message || '사용자 정보가 일치하지 않습니다.'); 
      }
    } catch (error) {
      console.error('본인 인증 API 호출 중 오류 발생:', error);
      alert('서버와 통신하는 중 문제가 발생했습니다.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      alert("새로운 비밀번호가 일치하지 않습니다.");
      return;
    }
    if(!newPassword) {
      alert("새로운 비밀번호를 입력해주세요.");
      return;
    }
    if(!resetToken) {
      alert("본인 확인을 먼저 완료해주세요.");
      return;
    }
    
    try {
      const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken: resetToken,
          newPassword: newPassword,
          confirmPassword: newPasswordConfirm,
        }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "비밀번호가 성공적으로 재설정되었습니다. 다시 로그인해주세요.");
      setIsModalOpen(false);
      setResetToken('');
      navigate('/Userlogin');
    } else {
      alert(data.message || "비밀번호 재설정에 실패했습니다.");
    } 
  } catch (error) {
    console.error('비밀번호 재설정 API 호출 중 오류 발생:', error);
    alert('서버와 통신하는 중 문제가 발생했습니다.');
  }
};

  const closeModal = () => {
    setIsModalOpen(false);
    setNewPassword('');
    setNewPasswordConfirm('');
    setResetToken('');
  };

    const goToLogin = () => {
    closeModal();
    navigate('/Userlogin'); // 로그인 페이지로 이동
  };

  return (
    <>
      <section className="logincontainer">
        <h3>비밀번호를 분실했다면 하단에 이름과 아이디, 생년월일을 입력해주세요.</h3>

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
          <label htmlFor="username">아이디</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="sam12"
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
            <button type="submit" className="find-pwd-btn">비밀번호 재설정</button>
          </div>
        </form>

        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>비밀번호 재설정</h2>
            <p>하단에 새로운 비밀번호를 입력해주세요.</p>
            <form onSubmit={handleResetPassword}>
              <label htmlFor="newPassword">새로운 비밀번호</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} 
                required  />
              
              <label htmlFor="newPasswordConfirm">비밀번호 확인</label>
              <input
                id="newPasswordConfirm"
                name="newPasswordConfirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required />

              <div className="button-container">
                <button type="submit" className="reset-password-btn">
                  비밀번호 재설정
                </button>
              </div>
            </form>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default FindAccount02;