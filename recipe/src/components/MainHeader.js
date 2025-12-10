import React, { useState, useEffect, useRef } from 'react';
import logo from '../img/logo.jpg';
import './MainHeader.css';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '../img/search.png';

// 임시 레시피 데이터
const MOCK_RECIPES = [
  { id: 1, title: '김치볶음밥' },
  { id: 2, title: '김치찌개' },
  { id: 3, title: '된장찌개' },
  { id: 4, title: '계란찜' },
  { id: 5, title: '제육볶음' },
  { id: 6, title: '소불고기' },
  { id: 7, title: '해물파전' },
];

function MainHeader({ showSearch = true }) {
  const navigate = useNavigate();
  const searchContainerRef = useRef(null); // 2. DOM 요소 참조를 위한 ref

  // 3. 상태 변수 추가
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]); // 추천 목록 상태
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false); // 목록 표시 여부

  // 4. 외부 클릭 감지 로직 (추천 목록 닫기용)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 5. 검색어 입력 시 추천 목록 필터링
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 0) {
      const filteredSuggestions = MOCK_RECIPES.filter(recipe =>
        recipe.title.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setIsSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  // 6. 추천 항목 클릭 시 검색창 채우기
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    // Main 페이지로 이동하면서 검색어를 쿼리 파라미터로 전달
    navigate(`/Main?keyword=${encodeURIComponent(query.trim())}`);
    setQuery(''); // 검색 후 검색창 초기화
    setIsSuggestionsVisible(false);
  };

  // 로그인 상태 확인
  const isAuthenticated = () => !!localStorage.getItem('token');

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/Home');
  };

  return (
    <div className="main-header-wrapper">
      <div className="main-header-left">
        <Link to={isAuthenticated() ? "/Main" : "/Home"}>
        <img src={logo} alt='냉장고를 부탁해' className='logo'/>
        </Link>
      </div>
      {showSearch && (
      <div className="main-header-center" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="레시피를 검색하세요"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 0 && setIsSuggestionsVisible(true)}
          />
          <button className='search-icon-button' type='submit'><img src={SearchIcon} alt='검색' /></button>
        </form>
        {/* 8. 추천 목록 렌더링 */}
        {isSuggestionsVisible && suggestions.length > 0 && (
          <ul className="search-suggestions">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
      <div className="main-header-right">
        {isAuthenticated() ? (
          <button className='auth-button' onClick={handleLogout}>로그아웃</button>
        ) : (
          <>
            <Link to="/Userlogin" className="auth-button">
              <button>로그인</button>
            </Link>
            <Link to="/Register" className="auth-button">
              <button>회원가입</button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default MainHeader;