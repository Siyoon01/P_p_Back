import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 * @param {React.Component} children - 보호할 컴포넌트
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => !!localStorage.getItem('token');

  if (!isAuthenticated()) {
    // 로그인하지 않은 경우 Home 페이지로 리다이렉트
    return <Navigate to="/Home" replace />;
  }

  return children;
};

export default ProtectedRoute;

