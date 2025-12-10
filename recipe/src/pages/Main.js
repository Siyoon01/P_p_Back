import React from "react";
import './Main.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useGlobalLoading } from '../components/LoadingProvider';

function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const { show, hide } = useGlobalLoading();

  // 재료, 임박 재료, 추천 레시피, 검색 상태
  const [ingredients, setIngredients] = useState([]);
  const [approachingExpiries, setApproachingExpiries] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // 레시피 추천 - 주제,재료
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [topicTags, setTopicTags] = useState([]);
  const [topicInput, setTopicInput] = useState([]);
  const [hasMainIngredient, setHasMainIngredient] = useState(true);
  
  // 검색 결과 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 5;

  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('query') || '';
  const keywordFromUrl = searchParams.get('keyword') || '';

  const handleTopicInputChange = (e) => {
    setTopicInput(e.target.value);
  };

  // 키워드 검색 함수 (헤더 검색바에서 사용)
  const searchRecipesByKeyword = useCallback(async (keyword) => {
    if (!keyword || !keyword.trim()) {
      setRecipes([]);
      return;
    }

    setIsSearching(true);
    show();

    try {
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/recipes?keyword=${encodeURIComponent(keyword.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('레시피 검색에 실패했습니다.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setRecipes(result.data);
      } else {
        setRecipes([]);
      }
    } catch (e) {
      console.error(e);
      setRecipes([]);
      alert('레시피를 가져오지 못했어요.');
    } finally {
      setIsSearching(false);
      hide();
    }
  }, [show, hide]);

  // 재료/주제 기반 검색 함수 (레시피 추천받기 섹션에서 사용)
  const searchRecipes = useCallback(async () => {
    if (selectedIngredients.length === 0 && topicTags.length === 0) {
      alert('재료를 선택하거나 주제를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    show();

    const searchData = {
      ingredients: selectedIngredients,
      topics: topicTags,
      hasMainIngredient: hasMainIngredient
    };

    try {
      // API 구현
      await new Promise(res => setTimeout(res, 800));
      const mock = [
        { id: 'r1', title: '추천 레시피 1', image: '/mock/kimchi.jpg' },
        { id: 'r2', title: '추천 레시피 2', image: '/mock/noodle.jpg' },
      ];
      setRecipes(mock);
    } catch (e) {
      console.error(e);
      setRecipes([]);
      alert('레시피를 가져오지 못했어요.');
    } finally {
      setIsSearching(false);
      hide();
    }
  }, [selectedIngredients, topicTags, hasMainIngredient, show, hide]);

  // 재료 목록 불러오기
  useEffect(() => {
    let alive = true;
    async function fetchFridge() {
      show();
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIngredients([]);
          setApproachingExpiries([]);
          hide();
          return;
        }

        // GET /api/ingredients - 보유 식재료 목록 조회
        const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error('냉장고 데이터를 불러오지 못했어요');
        }
        
        const data = await res.json();
        if (!alive) return;

        // 백엔드 응답 형식: { success: true, data: [...] }
        const list = Array.isArray(data?.data) ? data.data : [];
        
        // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
        const formattedIngredients = list.map(item => ({
          id: item.id,
          name: item.name,
          expiry: item.expiryDate, // expiryDate → expiry
          quantity: item.quantity_value,
          unit: item.quantity_unit
        }));
        
        setIngredients(formattedIngredients);

      } catch (e) {
        if (!alive) return;
        console.error(e);
        setIngredients([]);
      } finally {
        hide();
      }
    }
    fetchFridge();
    return () => { alive = false; };
  }, [show, hide]);

  // 소비기한 임박 식재료 조회
  useEffect(() => {
    let alive = true;
    async function fetchExpiringIngredients() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setApproachingExpiries([]);
          return;
        }

        // GET /api/ingredients/expiring - 소비기한 임박 식재료 조회
        const res = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients/expiring', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error('임박 식재료 데이터를 불러오지 못했어요');
        }
        
        const data = await res.json();
        if (!alive) return;

        // 백엔드 응답 형식: { success: true, data: [...] }
        const list = Array.isArray(data?.data) ? data.data : [];
        
        // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
        const formattedExpiring = list.map(item => ({
          id: item.id,
          name: item.name,
          expiry: item.expiryDate, // expiryDate → expiry
          quantity: item.quantity_value,
          unit: item.quantity_unit
        }));
        
        setApproachingExpiries(formattedExpiring);

      } catch (e) {
        if (!alive) return;
        console.error(e);
        setApproachingExpiries([]);
      }
    }
    fetchExpiringIngredients();
    return () => { alive = false; };
  }, []);
    
  // 헤더 검색바와 URL 파라미터 연동 (keyword 검색)
  useEffect(() => {
    if (keywordFromUrl) {
      searchRecipesByKeyword(keywordFromUrl);
      setCurrentPage(1); // 검색 시 첫 페이지로 리셋
    } else if (queryFromUrl) {
      // 기존 query 파라미터도 지원 (하위 호환성)
      searchRecipesByKeyword(queryFromUrl);
      setCurrentPage(1); // 검색 시 첫 페이지로 리셋
    }
  }, [keywordFromUrl, queryFromUrl, searchRecipesByKeyword]);
  
  // 현재 페이지의 레시피 계산
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = recipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  
  // 페이지 변경 핸들러
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 주제 태그 핸들러
  const handleTopicInputKeyPress = (e) => {
    if (e.key == 'Enter' && topicInput.trim()) {
      e.preventDefault();
      if (!topicTags.includes(topicInput.trim())) {
        setTopicTags([...topicTags, topicInput.trim()]);
      }
      setTopicInput('');
    }
  };

  const handleTopicTagDelete = (tagToDelete) => {
    setTopicTags(topicTags.filter(tag => tag !== tagToDelete));
  };

  // 인기 레시피 랭킹 상태
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [rankPage, setRankPage] = useState(0);
  const rankingRef = useRef(null);
  const rankingPerPage = 3;

  // 최근 본 레시피 상태
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recentPage, setRecentPage] = useState(0);
  const recentRef = useRef(null);
  const recentPerPage = 3;

  // 인기 레시피 조회
  useEffect(() => {
    async function fetchPopularRecipes() {
      try {
        const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/recipes/popular', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && Array.isArray(result.data)) {
            // 백엔드에서 이미 view_count 기준으로 정렬되어 오므로 그대로 사용
            setPopularRecipes(result.data);
          } else {
            // 데이터가 없거나 형식이 잘못된 경우 빈 배열로 설정
            console.warn('인기 레시피 데이터 형식 오류:', result);
            setPopularRecipes([]);
          }
        } else {
          // 에러 응답인 경우 빈 배열로 설정하여 화면이 깨지지 않도록
          console.warn('인기 레시피 조회 실패:', response.status);
          setPopularRecipes([]);
        }
      } catch (error) {
        // 네트워크 오류 등 예외 발생 시에도 빈 배열로 설정
        console.warn('인기 레시피 조회 오류:', error.message);
        setPopularRecipes([]);
      }
    }
    fetchPopularRecipes();
  }, []);

  // 최근 본 레시피 조회 함수 (외부에서도 호출 가능하도록)
  const fetchRecentRecipes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('최근 본 레시피: 로그인이 필요합니다.');
        setRecentRecipes([]);
        return;
      }

      console.log('🔄 최근 본 레시피 조회 시작...');
      
      // 브라우저 내장 fetch 사용 (Node.js 18+ 호환)
      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/recipes/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include', // 쿠키 포함 (필요한 경우)
      });

      console.log('📡 최근 본 레시피 API 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('📦 최근 본 레시피 API 응답 데이터:', result);
        
        if (result.success !== undefined) {
          if (result.success && result.data && Array.isArray(result.data)) {
            // 백엔드 응답 형식에 맞게 변환
            const formattedRecipes = result.data
              .filter(recipe => recipe && recipe.id) // 유효한 레시피만 필터링
              .map(recipe => ({
                id: recipe.id,
                title: recipe.title || '',
                description: recipe.description || '',
                main_image_url: recipe.main_image_url || ''
              }));
            
            console.log('✅ 최근 본 레시피 변환 완료:', formattedRecipes.length, '개');
            if (formattedRecipes.length > 0) {
              console.log('📋 레시피 목록:', formattedRecipes.map(r => ({ id: r.id, title: r.title })));
            } else {
              console.log('💡 최근 본 레시피가 없습니다. 레시피를 조회해보세요.');
            }
            setRecentRecipes(formattedRecipes);
          } else if (result.success && (!result.data || result.data.length === 0)) {
            // 성공했지만 데이터가 없는 경우
            console.log('💡 최근 본 레시피가 없습니다.');
            setRecentRecipes([]);
          } else {
            console.warn('⚠️ 최근 본 레시피: 데이터 형식 오류', result);
            setRecentRecipes([]);
          }
        } else {
          console.warn('⚠️ 최근 본 레시피: 응답 형식 오류 (success 필드 없음)', result);
          setRecentRecipes([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 최근 본 레시피 조회 실패:', response.status, errorData);
        if (response.status === 401) {
          console.error('   인증 오류: 토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        } else if (response.status === 500) {
          console.error('   서버 오류: 서버 로그를 확인하세요.');
        }
        setRecentRecipes([]);
      }
    } catch (error) {
      console.error('❌ 최근 본 레시피 조회 오류:', error);
      console.error('에러 상세:', error.message);
      console.error('에러 타입:', error.name);
      
      // 네트워크 오류인 경우
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('   네트워크 오류: 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
      }
      
      setRecentRecipes([]);
    }
  }, []);

  // 최근 본 레시피 조회 - 페이지 로드 시 항상 조회
  useEffect(() => {
    console.log('📍 Main 페이지 useEffect 실행 - 최근 본 레시피 조회');
    fetchRecentRecipes();
  }, [fetchRecentRecipes]);

  // 페이지 포커스 및 가시성 변경 시에도 조회
  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ 페이지 포커스 - 최근 본 레시피 다시 조회');
      fetchRecentRecipes();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ 페이지 가시성 변경 - 최근 본 레시피 다시 조회');
        fetchRecentRecipes();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRecentRecipes]);

  // 랭킹 페이지네이션
  const totalRankPages = Math.ceil(popularRecipes.length / rankingPerPage);
  
  const goToRankPage = (pageIndex) => {
    const clamped = Math.max(0, Math.min(pageIndex, totalRankPages - 1));
    setRankPage(clamped);
    const container = rankingRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({ left: clamped * width, behavior: 'smooth' });
    }
  };

  const handleRankNext = () => goToRankPage(rankPage + 1);
  const handleRankPrev = () => goToRankPage(rankPage - 1);

  // 최근 본 레시피 페이지네이션
  const totalRecentPages = Math.ceil(recentRecipes.length / recentPerPage);
  
  const goToRecentPage = (pageIndex) => {
    const clamped = Math.max(0, Math.min(pageIndex, totalRecentPages - 1));
    setRecentPage(clamped);
    const container = recentRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({ left: clamped * width, behavior: 'smooth' });
    }
  };

  const handleRecentNext = () => goToRecentPage(recentPage + 1);
  const handleRecentPrev = () => goToRecentPage(recentPage - 1);

  // 소비기한 임박 식재료는 백엔드 API에서 조회하므로 이 useEffect는 제거됨

  return (
    <main className="MainPage">
      {/* 검색 결과를 제일 위에 표시 */}
      {(keywordFromUrl || queryFromUrl) && (
        <div className="search-results-section">
          <div className="search-result-header-container">
            <h2 className="search-result-title">검색 결과: "{keywordFromUrl || queryFromUrl}"</h2>
            {recipes.length > 0 && (
              <p className="search-result-count">총 {recipes.length}개의 레시피를 찾았습니다.</p>
            )}
          </div>
          
          {isSearching && recipes.length === 0 && (
            <div className="search-loading">
              <p>검색 중...</p>
            </div>
          )}
          
          {!isSearching && recipes.length === 0 && (
            <div className="search-no-results">
              <p>"{keywordFromUrl || queryFromUrl}"에 대한 검색 결과가 없습니다.</p>
              <p className="search-hint">다른 검색어로 시도해보세요.</p>
            </div>
          )}
          
          {recipes.length > 0 && (
            <>
              <div className="recipe-table-container">
                <table className="recipe-table">
                  <thead>
                    <tr>
                      <th>Index</th>
                      <th>제목</th>
                      <th>메인이미지</th>
                      <th>재료 정보</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecipes.map((rcp, index) => (
                      <tr
                        key={rcp.id}
                        onClick={() => navigate(`/RecipeDetail/${rcp.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{indexOfFirstRecipe + index + 1}</td>
                        <td>{rcp.title}</td>
                        <td>
                          {rcp.main_image_url ? (
                            <>
                              <img 
                                src={rcp.main_image_url} 
                                alt={rcp.title} 
                                className="recipe-main-image-thumbnail"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const placeholder = e.target.nextElementSibling;
                                  if (placeholder) {
                                    placeholder.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="recipe-main-image-placeholder" style={{ display: 'none' }}>이미지 없음</div>
                            </>
                          ) : (
                            <div className="recipe-main-image-placeholder">이미지 없음</div>
                          )}
                        </td>
                        <td className="recipe-ingredients-cell">
                          {rcp.ingredients && rcp.ingredients.length > 0
                            ? rcp.ingredients.join(', ')
                            : '재료 정보 없음'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={handlePrevPage} disabled={currentPage === 1}>
                    이전
                  </button>
                  <span className="page-info">
                    {currentPage} / {totalPages}
                  </span>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <section className="ingredient-banner">
        <div className="ingredient-header">
        <div className="header-placeholder"></div>
          <h3>지금 나의 냉장고 속 재료는?</h3>
          <Link to="/Myfridge" className="link-to-fridge">더보기</Link>
        </div>
        <div className="ingredient-list">
            {ingredients.length > 0 ? (
                ingredients.map(item => (
                    <button key={item.id} className="ingredient-button selected" type="button">
                        {item.name}
                    </button>
                ))
            ) : (
                <p>냉장고가 비어있어요!</p>
            )}
          </div>
      </section>

      {/* 임박 재료 배너: 데이터 있을 때만 */}
      {approachingExpiries.length > 0 && (
        <section className="expiring-banner">
          <div className="expiring-header">
            <h3>유통기한이 임박했어요!</h3>
          </div>
          <div className="expiring-list">
            {approachingExpiries.map(item => (
              <button key={item.id} className="expiring-button selected" type="button">
                  {item.name}
                </button>
                ))}
          </div>
        </section>
      )}

      {/* 인기 레시피 랭킹 섹션 */}
      <div className="ranking-section">
        <h3 className="ranking-title">🍳 가장 조회수가 많은 레시피 랭킹</h3>

        {popularRecipes.length > 0 ? (
          <div className="ranking-slider-wrapper">
            <button 
              className="rank-nav left" 
              onClick={handleRankPrev} 
              disabled={rankPage === 0}
            >
              ‹
            </button>

            <div
              className="ranking-slider"
              ref={rankingRef}
            >
              {popularRecipes.map((r) => (
                <div 
                  key={r.id} 
                  className="recipe-card ranking-card"
                  onClick={() => navigate(`/RecipeDetail/${r.id}`)}
                >
                  <div className="recipe-info">
                    <h4 className="recipe-name">{r.title}</h4>
                    <p className="recipe-description">{r.description || ''}</p>
                  </div>
                  <img 
                    src={r.main_image_url || ''} 
                    alt={r.title} 
                    className="recipe-image" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>

            <button 
              className="rank-nav right" 
              onClick={handleRankNext}
              disabled={rankPage >= totalRankPages - 1}
            >
              ›
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            인기 레시피를 불러오는 중...
          </div>
        )}
      </div>

      {/* 최근 본 레시피 섹션 - 항상 표시 */}
      <div className="ranking-section">
        <h3 className="ranking-title">📖 최근에 본 레시피</h3>

        {recentRecipes.length > 0 ? (
          <div className="ranking-slider-wrapper">
            <button 
              className="rank-nav left" 
              onClick={handleRecentPrev} 
              disabled={recentPage === 0}
            >
              ‹
            </button>

            <div
              className="ranking-slider"
              ref={recentRef}
            >
              {recentRecipes.map((r) => (
                <div 
                  key={r.id} 
                  className="recipe-card ranking-card"
                  onClick={() => navigate(`/RecipeDetail/${r.id}`)}
                >
                  <div className="recipe-info">
                    <h4 className="recipe-name">{r.title}</h4>
                    <p className="recipe-description">{r.description || ''}</p>
                  </div>
                  <img 
                    src={r.main_image_url || ''} 
                    alt={r.title} 
                    className="recipe-image" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>

            <button 
              className="rank-nav right" 
              onClick={handleRecentNext}
              disabled={recentPage >= totalRecentPages - 1}
            >
              ›
            </button>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem', 
            color: '#666',
            background: '#f9f9f9',
            borderRadius: '10px',
            border: '2px dashed #ddd'
          }}>
            {localStorage.getItem('token') ? (
              <>
                <p style={{ fontSize: '16px', marginBottom: '10px', fontWeight: '500' }}>
                  최근 본 레시피가 없습니다.
                </p>
                <p style={{ fontSize: '14px', color: '#999', lineHeight: '1.6' }}>
                  레시피 상세 페이지를 방문하면 조회 기록이 저장됩니다.
                </p>
                <button
                  onClick={() => {
                    fetchRecentRecipes();
                  }}
                  style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 다시 불러오기
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '16px', marginBottom: '10px', fontWeight: '500' }}>
                  로그인이 필요합니다.
                </p>
                <p style={{ fontSize: '14px', color: '#999', lineHeight: '1.6' }}>
                  로그인 후 레시피를 조회하면 최근 본 레시피가 표시됩니다.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 레시피 추천받기 */}
      <section className="recommend-section">
        <div className="recommend-title-section">
          <h3 className="recommend-title">레시피 추천받기</h3>
          <button className="recommend-btn" onClick={searchRecipes} disabled={isSearching}>
              {isSearching ? '검색 중...' : '검색'}
          </button>
         </div>
         <div className="chosse-section">
        {/* 재료 선택 */}
        <div className="ingredient-form">
          <label>재료 선택하기</label>
                <div className="ingredient-pills">
                  {ingredients.map((item) => {
                    const active = selectedIngredients.includes(item.name);
                    return (
                      <button
                        key={item.id}
                        className={`chip ${active ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault(); // form 제출 방지
                          setSelectedIngredients((prev) =>
                            prev.includes(item.name)
                              ? prev.filter(v => v !== item.name)
                              : [...prev, item.name]
                          );
                        }}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
        {/* 주제 검색 */}
        <div className="recommend-row">
           <label className="row-label">주제 선택하기</label>
           <div className="row-content topic-container">
              <input
                type="text"
                className="topic-input"
                placeholder="텍스트 입력 후 엔터"
                value={topicInput}
                onChange={handleTopicInputChange}
                onKeyPress={handleTopicInputKeyPress}
              />
              <div className="topic-tags-list">
                {topicTags.map((tag, index) => (
                  <span key={index} className="topic-tag">
                    {tag}
                    <button onClick={() => handleTopicTagDelete(tag)}>X</button>
                  </span>
                ))}
              </div>
           </div>
        </div>
        {/* 주재료 유무 선택*/}
        <div className="recommend-row">
          <label className="row-label">주재료 유무 선택하기</label>
          <div className="row-content radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="mainIngredient"
                checked={hasMainIngredient === true}
                onChange={() => setHasMainIngredient(true)}
              />
              주재료 포함하기
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="mainIngredient"
                checked={hasMainIngredient === false}
                onChange={() => setHasMainIngredient(false)}
              />
              주재료 미포함하기
            </label>
          </div>
        </div>

        {/* 레시피 추천 결과 (재료/주제 기반 검색) */}
        {!keywordFromUrl && !queryFromUrl && recipes.length > 0 && (
          <div className="results-wrap">
            <div className="recipe-grid">
              {recipes.map((rcp) => (
                <article 
                  className="recipe-card" 
                  key={rcp.id}
                  onClick={() => navigate(`/RecipeDetail/${rcp.id}`)}
                >
                  <div className="recipe-card-image">
                    {rcp.image ? (
                      <img src={rcp.image} alt={rcp.title} loading="lazy" />
                    ) : (
                      <div className="recipe-card-image-placeholder">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="recipe-card-content">
                    <h3 className="recipe-card-title">{rcp.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        </div>
      </section>
    </main>
  );
}

export default Main;