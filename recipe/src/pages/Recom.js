import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Recom.css';

function Recom() {
  const navigate = useNavigate();
  const location = useLocation();

  const [ingredientPages, setIngredientPages] = useState([
    ['토마토', '양파', '당근', '감자', '브로콜리'],
    ['파프리카', '마늘', '생강', '대파', '시금치'],
    ['배추', '무', '오이', '상추', '깻잎'],
    ['버섯', '계란', '우유', '닭고기', '돼지고기'],
    ['소고기', '새우', '두부', '콩나물', '고추'],
    ['피망', '가지', '호박', '당근', '양배추']
  ]);
  const [currentIngredientPage, setCurrentIngredientPage] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [topicTags, setTopicTags] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [hasMainIngredient, setHasMainIngredient] = useState(true);
  const topicInputRef = useRef(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [previousRecipes, setPreviousRecipes] = useState([]); // 이전 레시피 상태 추가
  const [popularRecipes, setPopularRecipes] = useState([]); // 인기 레시피 상태 추가
  const [isSearching, setIsSearching] = useState(false); // 검색 중 상태 추가

  // 저장된 추천 레시피 복원 함수
  const restoreRecommendedRecipes = () => {
    const savedRecipes = sessionStorage.getItem('recommendedRecipes');
    const savedHasSearched = sessionStorage.getItem('hasSearched');
    
    if (savedRecipes && savedRecipes !== '[]' && savedRecipes !== 'null') {
      try {
        const parsedRecipes = JSON.parse(savedRecipes);
        if (parsedRecipes && Array.isArray(parsedRecipes) && parsedRecipes.length > 0) {
          setRecipes(parsedRecipes);
          if (savedHasSearched === 'true') {
            setHasSearched(true);
          }
          console.log('추천 레시피 복원됨:', parsedRecipes.length, '개');
        }
      } catch (error) {
        console.error('저장된 추천 레시피 복원 실패:', error);
      }
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchPreviousRecipes(); // 이전 레시피 불러오기
    fetchPopularRecipes(); // 인기 레시피 불러오기
    
    // 저장된 추천 레시피 복원
    restoreRecommendedRecipes();
  }, []);

  // location이 변경될 때마다 추천 레시피 복원 (뒤로가기 감지)
  useEffect(() => {
    if (location.pathname === '/Recom') {
      // 약간의 지연을 두어 상태가 초기화된 후 복원
      const timer = setTimeout(() => {
        restoreRecommendedRecipes();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.key]);

  // recipes 상태가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    if (recipes && recipes.length > 0 && hasSearched) {
      sessionStorage.setItem('recommendedRecipes', JSON.stringify(recipes));
      sessionStorage.setItem('hasSearched', 'true');
    }
  }, [recipes, hasSearched]);

  // 페이지 포커스 및 가시성 변경 시 복원
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === '/Recom') {
        restoreRecommendedRecipes();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/Recom') {
        restoreRecommendedRecipes();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        // 데이터를 페이지별로 나누기 (한 페이지당 10개)
        const pages = [];
        for (let i = 0; i < data.length; i += 10) {
          pages.push(data.slice(i, i + 10).map(item => item.name || item));
        }
        if (pages.length > 0) {
          setIngredientPages(pages);
        }
      }
    } catch (error) {
      console.log('서버 연결 실패, 더미 데이터 사용');
    }
  };


  // 이전 레시피 불러오기 함수
  const fetchPreviousRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      // 브라우저 내장 fetch 사용 (Node.js 18+ 호환)
      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/recipes/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include', // 쿠키 포함 (필요한 경우)
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        // 백엔드 응답 형식에 맞게 변환
        const formattedRecipes = data.map(recipe => ({
          id: recipe.id,
          name: recipe.title,
          description: recipe.description || '',
          image: recipe.main_image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop&crop=center'
        }));
        setPreviousRecipes(formattedRecipes);
      }
    } catch (error) {
      // 서버 연결 실패 시 빈 배열 유지 (디폴트)
      console.error('❌ 이전 레시피 조회 오류:', error);
      console.error('에러 상세:', error.message);
      
      // 네트워크 오류인 경우
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('   네트워크 오류: 서버에 연결할 수 없습니다.');
      }
      
      setPreviousRecipes([]);
    }
  };

  // 인기 레시피 불러오기 함수
  const fetchPopularRecipes = async () => {
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
          // 백엔드 응답 형식에 맞게 변환
          const formattedRecipes = result.data.map(recipe => ({
            id: recipe.id,
            name: recipe.title,
            description: recipe.description || '',
            image: recipe.main_image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop&crop=center'
          }));
          setPopularRecipes(formattedRecipes);
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
  };

  const handleIngredientSelect = (ingredient) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(item => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleTopicInputChange = (e) => setTopicInput(e.target.value);

  const handleTopicInputKeyPress = (e) => {
    if (e.key === 'Enter' && topicInput.trim()) {
      if (!topicTags.includes(topicInput.trim())) setTopicTags([...topicTags, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleTopicTagDelete = (tagToDelete) => setTopicTags(topicTags.filter(tag => tag !== tagToDelete));

  const handleRecipeClick = (recipeId) => {
    const ingredientsParam = selectedIngredients.join(',');
    navigate(`/RecipeDetail/${recipeId}?ingredients=${encodeURIComponent(ingredientsParam)}`);
  };

  const handleNextIngredientPage = () => {
    if (currentIngredientPage < ingredientPages.length - 1) setCurrentIngredientPage(currentIngredientPage + 1);
  };

  const handlePrevIngredientPage = () => {
    if (currentIngredientPage > 0) setCurrentIngredientPage(currentIngredientPage - 1);
  };

  const handleSearch = async () => {
    if (selectedIngredients.length === 0) {
      alert('재료를 하나 이상 선택해주세요!');
      return;
    }
    
    setIsSearching(true);
    
    try {
      // 백엔드의 /api/recipes/recommend API 사용 (POST)
      // 백엔드에서 재료 이름 배열을 받아서 ingredient_master_id로 변환함
      const token = localStorage.getItem('token');
      
      // 타임아웃 설정 (200초 = 3분 20초, 백엔드 타임아웃보다 약간 길게)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 200000);
      
      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/recipes/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          query: {
            queryText: topicTags.join(' ') || topicInput.trim() || '레시피', // topicTags가 있으면 사용, 없으면 topicInput 사용, 둘 다 없으면 기본값
            selectedIngredientsIds: selectedIngredients, // 재료 이름 배열 (백엔드에서 ID로 변환)
          },
          requireMain: hasMainIngredient,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const recipes = result.data || [];
        
        // 백엔드 응답 형식에 맞게 변환
        const formattedRecipes = recipes.map(recipe => ({
          id: recipe.id,
          name: recipe.title,
          description: recipe.description,
          details: recipe.required_ingredients ? recipe.required_ingredients.join(', ') : '',
          image: recipe.main_image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop&crop=center'
        }));
        
        setRecipes(formattedRecipes);
        setHasSearched(true);
        
        // sessionStorage에 추천 결과 저장 (뒤로가기 시 유지)
        if (formattedRecipes && formattedRecipes.length > 0) {
          sessionStorage.setItem('recommendedRecipes', JSON.stringify(formattedRecipes));
          sessionStorage.setItem('hasSearched', 'true');
          console.log('추천 레시피 저장됨:', formattedRecipes.length, '개');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || '레시피 검색에 실패했습니다.');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('레시피 추천 시간이 초과되었습니다. (최대 3분) 다시 시도해주세요.');
      } else {
        console.error('검색 API 호출 실패:', error);
        alert('레시피 추천 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // ranking slider state & refs
  const rankingPerPage = 3;
  const [rankPage, setRankPage] = useState(0);
  const rankingRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // 백엔드에서 이미 view_count 기준으로 정렬되어 오므로 그대로 사용
  const totalRankPages = Math.ceil(popularRecipes.length / rankingPerPage);

  const goToRankPage = (pageIndex) => {
    const clamped = Math.max(0, Math.min(pageIndex, totalRankPages -1));
    setRankPage(clamped);
    const container = rankingRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({ left: clamped * width, behavior: 'smooth' });
    }
  };

  const handleRankNext = () => goToRankPage(rankPage + 1);
  const handleRankPrev = () => goToRankPage(rankPage - 1);

  useEffect(() => {
    const container = rankingRef.current;
    if (!container) return;
    const handleResize = () => {
      goToRankPage(rankPage);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line
  }, []);

  const onRankMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - rankingRef.current.offsetLeft;
    scrollLeftStart.current = rankingRef.current.scrollLeft;
  };
  const onRankMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - rankingRef.current.offsetLeft;
    const walk = (startX.current - x);
    rankingRef.current.scrollLeft = scrollLeftStart.current + walk;
  };
  const onRankMouseUp = () => {
    isDragging.current = false;
    const container = rankingRef.current;
    if (!container) return;
    const page = Math.round(container.scrollLeft / container.clientWidth);
    setRankPage(Math.max(0, Math.min(page, totalRankPages-1)));
  };

  // 이전 레시피 slider state & refs
  const previousPerPage = 3;
  const [prevPage, setPrevPage] = useState(0);
  const previousRef = useRef(null);
  const isPrevDragging = useRef(false);
  const prevStartX = useRef(0);
  const prevScrollLeftStart = useRef(0);

  const totalPrevPages = Math.ceil(previousRecipes.length / previousPerPage);

  const goToPrevPage = (pageIndex) => {
    const clamped = Math.max(0, Math.min(pageIndex, totalPrevPages - 1));
    setPrevPage(clamped);
    const container = previousRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({ left: clamped * width, behavior: 'smooth' });
    }
  };

  const handlePrevNext = () => goToPrevPage(prevPage + 1);
  const handlePrevPrev = () => goToPrevPage(prevPage - 1);

  const onPrevMouseDown = (e) => {
    isPrevDragging.current = true;
    prevStartX.current = e.pageX - previousRef.current.offsetLeft;
    prevScrollLeftStart.current = previousRef.current.scrollLeft;
  };
  const onPrevMouseMove = (e) => {
    if (!isPrevDragging.current) return;
    e.preventDefault();
    const x = e.pageX - previousRef.current.offsetLeft;
    const walk = (prevStartX.current - x);
    previousRef.current.scrollLeft = prevScrollLeftStart.current + walk;
  };
  const onPrevMouseUp = () => {
    isPrevDragging.current = false;
    const container = previousRef.current;
    if (!container) return;
    const page = Math.round(container.scrollLeft / container.clientWidth);
    setPrevPage(Math.max(0, Math.min(page, totalPrevPages - 1)));
  };

  return (
    <div className="recom-container">
      <div className="recom-section-bar">
        <div className="recom-section-title">재료 선택하기</div>
        {currentIngredientPage > 0 && (
          <button className="recom-navigation-button" onClick={handlePrevIngredientPage}>‹</button>
        )}
        <div className="recom-ingredient-tags-wrapper">
          {ingredientPages[currentIngredientPage] && ingredientPages[currentIngredientPage].map((ingredient, index) => (
            <button
              key={index}
              className={`recom-ingredient-tag ${selectedIngredients.includes(ingredient) ? 'selected' : ''}`}
              onClick={() => handleIngredientSelect(ingredient)}
            >
              {ingredient}
            </button>
          ))}
        </div>
        {currentIngredientPage < ingredientPages.length - 1 && (
          <button className="recom-navigation-button" onClick={handleNextIngredientPage}>›</button>
        )}
      </div>

      <div className="recom-section-bar">
        <div className="recom-section-title">주제 선택하기</div>
        <div className="recom-topic-input-container">
          <input
            ref={topicInputRef}
            type="text"
            value={topicInput}
            onChange={handleTopicInputChange}
            onKeyPress={handleTopicInputKeyPress}
            placeholder="엔터로 입력"
            className="recom-topic-input"
            maxLength={20}
          />
          <div className="recom-topic-tags">
            {topicTags.map((tag, index) => (
              <div key={index} className="recom-topic-tag">
                {tag}
                <button className="recom-topic-tag-delete" onClick={() => handleTopicTagDelete(tag)}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recom-section-bar">
        <div className="recom-section-title">주재료 유무 선택하기</div>
        <div className="radio-container">
          <label className="checkbox-label">
            <span className="checkbox-text">주재료 포함하기</span>
            <div 
              className={`custom-checkbox ${hasMainIngredient ? 'checked' : ''}`}
              onClick={() => setHasMainIngredient(true)}
            >
              {hasMainIngredient && <span className="checkmark">✓</span>}
            </div>
          </label>
          <label className="checkbox-label">
            <span className="checkbox-text">주재료 미포함하기</span>
            <div 
              className={`custom-checkbox ${!hasMainIngredient ? 'checked' : ''}`}
              onClick={() => setHasMainIngredient(false)}
            >
              {!hasMainIngredient && <span className="checkmark">✓</span>}
            </div>
          </label>
        </div>
      </div>

      <div className="recipe-section">
        <div className="search-btn-container">
          <button 
            className="search-btn" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? '추천 중...' : '검색'}
          </button>
        </div>

        {/* 레시피 랭킹 섹션 */}
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
                onMouseDown={onRankMouseDown}
                onMouseMove={onRankMouseMove}
                onMouseLeave={onRankMouseUp}
                onMouseUp={onRankMouseUp}
                onTouchStart={(e) => { onRankMouseDown(e.touches[0]); }}
                onTouchMove={(e) => { onRankMouseMove(e.touches[0]); }}
                onTouchEnd={onRankMouseUp}
              >
                {popularRecipes.map((r) => (
                  <div 
                    key={r.id} 
                    className="recipe-card ranking-card"
                    onClick={() => handleRecipeClick(r.id)}
                  >
                    <div className="recipe-info">
                      <h4 className="recipe-name">{r.name}</h4>
                      <p className="recipe-description">{r.description}</p>
                    </div>
                    <img 
                      src={r.image} 
                      alt={r.name} 
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

        {/* 조건부 렌더링 */}
        {hasSearched ? (
          // 2번 케이스: 검색 후 추천 레시피 표시
          <>
            <div className="section-divider"></div>
            <div className="recommended-section">
              <h3 className="recommended-title">🍳 추천 레시피</h3>
              <div className="recipe-grid-container">
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="recipe-card recommended-card" 
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    <div className="recipe-info">
                      <h4 className="recipe-name">{recipe.name}</h4>
                      <p className="recipe-description">{recipe.description}</p>
                      <p className="recipe-ingredients">{recipe.details}</p>
                    </div>
                    <img 
                      src={recipe.image} 
                      alt={recipe.name} 
                      className="recipe-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : previousRecipes.length > 0 ? (
          // 3번 케이스: 이전 레시피 표시
          <>
            <div className="section-divider"></div>
            <div className="previous-recipe-section">
              <h3 className="previous-recipe-title">🍳 이전에 보셨던 레시피는 어떠신가요?</h3>

              <div className="previous-recipe-slider-wrapper">
                <button 
                  className="prev-nav left" 
                  onClick={handlePrevPrev} 
                  disabled={prevPage === 0}
                >
                  ‹
                </button>

                <div
                  className="previous-recipe-slider"
                  ref={previousRef}
                  onMouseDown={onPrevMouseDown}
                  onMouseMove={onPrevMouseMove}
                  onMouseLeave={onPrevMouseUp}
                  onMouseUp={onPrevMouseUp}
                  onTouchStart={(e) => { onPrevMouseDown(e.touches[0]); }}
                  onTouchMove={(e) => { onPrevMouseMove(e.touches[0]); }}
                  onTouchEnd={onPrevMouseUp}
                >
                  {previousRecipes.map((r) => (
                    <div 
                      key={r.id} 
                      className="recipe-card previous-recipe-card"
                      onClick={() => handleRecipeClick(r.id)}
                    >
                      <img src={r.image} alt={r.name} className="recipe-image" />
                      <div className="recipe-info">
                        <h4 className="recipe-name">{r.name}</h4>
                        <p className="recipe-description">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="prev-nav right" 
                  onClick={handlePrevNext}
                  disabled={prevPage >= totalPrevPages - 1}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        ) : (
          // 1번 케이스: 빈 박스 표시
          <div className="empty-recipe-container">
            <div className="empty-recipe-message">
              <div className="empty-title">아직 추천 레시피가 없습니다!</div>
              <div className="empty-subtitle">
                원하는 재료와 주제를 선택한 뒤 검색 버튼을 눌러 레시피를 추천받아 보세요
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recom;
