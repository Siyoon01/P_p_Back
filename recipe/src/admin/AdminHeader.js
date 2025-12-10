import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHeader.css';

function AdminHeader({ title = "냉장고를 부탁해 관리자 페이지" }) {
  const navigate = useNavigate();

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('admin_token'); 
    alert('로그아웃 되었습니다.');
    navigate('/Home'); // 비로그인 메인 페이지로 이동
  };

  return (
    <header className="admin-header">
      <div className="header-logo">
        {/* 로고 이미지 위치 - 추후 이미지 파일 추가 예정 */}
        <img src="/path/to/logo.png" alt="냉장고를 부탁해 로고" className="logo-image" />
      </div>
      <h1 className="header-title">{title}</h1>
      <button className="logout-button" onClick={handleLogout}>
        로그아웃
      </button>
    </header>
  );
}

export default AdminHeader;