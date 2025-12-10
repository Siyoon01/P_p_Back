import { NavLink } from "react-router-dom";
import React from 'react';
import './Nav.css';
import FridgeIcon from '../img/fridge.png';
import RecipeIcon from '../img/recipe-book.png';
import MypageIcon from '../img/user.png';

function Nav({ isAdmin }) {
  return (
    <nav className="navbar">
      <div className="nav-items-container">
        <NavLink 
          className={({ isActive }) => isActive ? "navbarMenu active" : "navbarMenu"} 
          to="/Myfridge">
            <img src={FridgeIcon} alt="나의 냉장고" className="nav-icon" />
            <span className="nav-text">나의 냉장고</span>
        </NavLink>
        <NavLink 
          className={({ isActive }) => isActive ? "navbarMenu active" : "navbarMenu"} 
          to="/Recom">
            <img src={RecipeIcon} alt="레시피 추천" className="nav-icon" />
            <span className="nav-text">레시피 추천</span>
        </NavLink>
        <NavLink 
          className={({ isActive }) => isActive ? "navbarMenu active" : "navbarMenu"} 
          to="/Mypage">
            <img src={MypageIcon} alt="마이페이지" className="nav-icon" />
            <span className="nav-text">마이페이지</span>
        </NavLink>
          {isAdmin && (
          <NavLink 
            className={({ isActive }) => isActive ? "navbarMenu active" : "navbarMenu"} 
            to="/admin">
              <span className="nav-icon-placeholder">⚙️</span>
              <span className="nav-text">관리자 페이지</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Nav;