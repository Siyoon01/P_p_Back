import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminNav.css';

function AdminNav() {
  const location = useLocation();

  const menuItems = [
    {
      id: 'user',
      title: '사용자 관리',
      clickableTitle: false,
      items: [
        { title: '사용자 목록 상세 조회 및 계정 상태 관리', path: '/admin/AdminUser', clickable: true }
      ]
    },
    {
      id: 'recipe',
      title: '레시피 관리',
      clickableTitle: false,
      items: [
        { title: '레시피 상세 정보 조회', path: '/admin/AdminRecipe', clickable: true }
      ]
    },

    {
      id: 'stats',
      title: '통계 및 분석',
      clickableTitle: true,
      path: '/admin/AdminStatistics',
      items: [
        { title: '사용자 - 성비, 연령', clickable: false },
        { title: '식재료 - 가장 많이 등록된 식재료', clickable: false },
        { title: '레시피 - 가장 많이 추천된 레시피', clickable: false }
      ]
    }
  ];

  return (
    <nav className="admin-nav">
      <div className="nav-content">
        {menuItems.map((menu) => (
          <div key={menu.id} className="nav-section">
            {menu.clickableTitle ? (
              <Link 
                to={menu.path} 
                className={`nav-section-title clickable ${location.pathname === menu.path ? 'active' : ''}`}
              >
                {menu.title}
              </Link>
            ) : (
              <h3 className="nav-section-title">{menu.title}</h3>
            )}
            <div className="nav-items">
              {menu.items.map((item, index) => (
                item.clickable ? (
                  <Link
                    key={index}
                    to={item.path}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span key={index} className="nav-item-text">
                    {item.title}
                  </span>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export default AdminNav;