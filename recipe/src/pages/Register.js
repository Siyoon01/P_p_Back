import React from "react";
import './Register.css';
import Stage from "../components/Stage";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [gender, setGender] = useState('');
  const [btd, setBtd] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();

  // 비밀번호 일치 여부 확인
  if (password !== passwordConfirm) {
    alert("비밀번호가 일치하지 않습니다.");
    return; // 비밀번호 불일치 시 함수 실행 중단
  }

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

  // 백엔드 API 호출
  try {
    const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gender: gender,
        birthdate: btd,
        fullName: name,
        nickname: nickname,
        userId: username,
        userPW: password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "회원가입이 완료되었습니다!");
      navigate('/login');
    } else {
      alert(data.message || "회원가입에 실패했습니다.");
    }
  } catch (error) {
    console.error('회원가입 API 호출 중 오류 발생:', error);
    alert('서버와 통신하는 중 문제가 발생했습니다. 네트워크를 확인해주세요.');
  }
};

  return (
    <>
    <Stage currentstage={1} />
    <section className="registercontainer">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nickname">닉네임</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          required
        />

        <label htmlFor="username">아이디</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="아이디를 입력하세요"
          required
        />

        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
        />

        <label htmlFor="passwordConfirm">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          required
        />

        <label htmlFor="name">이름</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          required
        />
        <label htmlFor="btd">생년월일</label>
        <input
          id="btd"
          type="text"
          inputMode="numeric"
          maxLength="6"
          value={btd}
          onChange={handleBirthdateChange}
          placeholder="생년월일 6자리(YYMMDD)를 입력하세요."
          pattern="\d{6}"
          required
        />
        {btd.length === 6 && (
          <small style={{ color: '#666', fontSize: '0.85em' }}>
            월(MM): {btd.substring(2, 4)}, 일(DD): {btd.substring(4, 6)}
          </small>
        )}
      <fieldset className="gender-group">
        <legend>성별</legend>
          <input
          id="gender-male"
          name="gender"
          type="radio"
          value="male"
          checked={gender === 'male'}
          onChange={(e) => setGender(e.target.value)}
          required
          className='gender-input'
        />
        <label htmlFor="gender-male" className='gender-label'>남성</label>

        <input
          id="gender-female"
          name="gender"
          type="radio"
          value="female"
          checked={gender === 'female'}
          onChange={(e) => setGender(e.target.value)}
          required
          className='gender-input'
        />
        <label htmlFor="gender-female" className='gender-label'>여성</label>
      </fieldset>

        <button type="submit" className="registerbutton">회원가입 완료</button>
      </form>
    </section>
    </>
  )
}

export default Register;