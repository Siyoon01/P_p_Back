import React, {useState} from "react";
import './Userlogin.css';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = async(e) => {
    e.preventDefault(); // 폼 제출 시 새로고침 방지

    console.log('로그인 시도:', {username, password});

    try {
    const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/login', { // 백엔드의 로그인 API 엔드포인트
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ // API 설계에 따라 userID로 전송
        userID: username, // API 설계에 따라 userID로 전송
        userPW: password, // API 설계에 따라 userPW로 전송
      }),
    });

    const data = await res.json(); // 백엔드의 응답 (JSON 형태)을 파싱

    if (res.ok) { // HTTP 상태 코드가 200번대 (200, 201 등) -> 성공
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data)); // result_code 형식에 맞게 data.data 사용
      alert(data.message);
      navigate('/Main');
    } else { // HTTP 상태 코드가 400, 500번대 -> 실패
      alert(data.message || '로그인 실패'); // 백엔드에서 보낸 실패 메시지 또는 기본 메시지
    }
  } catch (error) {
    console.error('로그인 API 호출 중 오류 발생:', error);
    alert('서버와 통신하는 중 문제가 발생했습니다. 네트워크를 확인해주세요.');
    }
  };

  return(
    <>
      <section className="logincontainer">
        <form onSubmit={handleLogin}>
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoFocus
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
          <div className="button-group">
              <button type="submit" className="login-button">로그인</button>
            <div className="find-group">
              <Link to="/FindAccount01" className="find">아이디 찾기</Link>
              <Link to="/FindAccount02" className="find">비밀번호 재설정</Link>
            </div>
          </div>
        </form>
      </section>
    </>
  )

}
export default Login;