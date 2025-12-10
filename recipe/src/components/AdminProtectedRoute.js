import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 관리자 권한이 필요한 페이지를 보호하는 컴포넌트
 * 로그인 여부와 관리자 권한(role === 'admin')을 모두 확인합니다.
 * @param {React.Component} children - 보호할 컴포넌트
 */
const AdminProtectedRoute = ({ children }) => {
  // 1. 로그인 여부 확인
  const isAuthenticated = () => !!localStorage.getItem('token');

  // 2. 사용자 정보에서 role 확인
  const getUserInfo = () => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        return null;
      }
    }
    return null;
  };

  // 3. 관리자 권한 확인
  const isAdmin = () => {
    const userInfo = getUserInfo();
    return userInfo && userInfo.role === 'admin';
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated()) {
    alert('로그인이 필요합니다.');
    return <Navigate to="/Home" replace />;
  }

  // 관리자 권한이 없는 경우
  if (!isAdmin()) {
    alert('관리자 권한이 필요합니다.');
    return <Navigate to="/Main" replace />;
  }

  // 로그인되어 있고 관리자 권한이 있는 경우
  return children;
};

export default AdminProtectedRoute;

