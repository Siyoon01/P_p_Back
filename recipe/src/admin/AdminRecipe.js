import React, { useState, useEffect } from 'react';
import './AdminRecipe.css';

// 숫자 → 첫·두·세 번째 변환
const numberToKorean = (num) => {
  const korean = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  return korean[num - 1] || `${num}`;
};

function AdminRecipe() {
  const [allRecipes, setAllRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 10;

  const fetchRecipes = async (keyword = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // keyword가 있으면 쿼리 파라미터로 추가
      const url = keyword 
        ? `http://ceprj2.gachon.ac.kr:65031/api/recipes?keyword=${encodeURIComponent(keyword)}`
        : 'http://ceprj2.gachon.ac.kr:65031/api/recipes';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('레시피 목록 조회 실패');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setAllRecipes(result.data);
        setCurrentPage(1); // 검색 시 첫 페이지로 리셋
      } else {
        throw new Error(result.message || '레시피 목록 조회 실패');
      }
    } catch (err) {
      console.error('레시피 목록 조회 오류:', err);
      setError(err.message);
      alert('레시피 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes(searchKeyword);
  };

  // 검색어 초기화 핸들러
  const handleClearSearch = () => {
    setSearchKeyword('');
    fetchRecipes('');
  };

  // 현재 페이지의 레시피 계산
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = allRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(allRecipes.length / recipesPerPage);

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

  const handleRowClick = async (recipe) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 레시피 상세 정보 조회
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/recipes/${recipe.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('레시피 상세 정보 조회 실패');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const recipeData = result.data;
        setSelectedRecipe({
          id: recipeData.id,
          name: recipeData.title,
          description: recipeData.description,
          completedImage: recipeData.main_image_url,
          ingredients: recipeData.required_ingredients || [],
          steps: recipeData.steps || [],
          stepImages: (recipeData.steps || []).map(step => step.image_url)
        });
        setIsPopupOpen(true);
        setIsEditMode(false);
      } else {
        throw new Error(result.message || '레시피 상세 정보 조회 실패');
      }
    } catch (err) {
      console.error('레시피 상세 정보 조회 오류:', err);
      alert('레시피 상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleOverlayClick = () => {
    setIsPopupOpen(false);
    setSelectedRecipe(null);
    setIsEditMode(false);
  };

  // 삭제 기능
  const handleDelete = () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setAllRecipes(allRecipes.filter(r => r.id !== selectedRecipe.id));
    setIsPopupOpen(false);
  };

  // 수정 → 저장
  const handleSave = () => {
    setAllRecipes(prev =>
      prev.map(r => (r.id === selectedRecipe.id ? selectedRecipe : r))
    );
    setIsEditMode(false);
  };

  // 이미지 에러 핸들러 - placeholder 표시
  const handleImageError = (e) => {
    e.target.style.display = 'block';
    e.target.src = '';
    e.target.style.backgroundColor = '#f0f0f0';
  };

  if (loading) {
    return (
      <div className="admin-recipe-container">
        <h2>레시피 목록 상세 조회 및 관리</h2>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-recipe-container">
        <h2>레시피 목록 상세 조회 및 관리</h2>
        <p>오류: {error}</p>
      </div>
    );
  }

  return (
    <div className="admin-recipe-container">
      <h2>레시피 목록 상세 조회 및 관리</h2>

      {/* ============= 검색 영역 ============= */}
      <div className="recipe-search-container">
        <form onSubmit={handleSearch} className="recipe-search-form">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="레시피 제목 또는 설명으로 검색..."
            className="recipe-search-input"
          />
          <button type="submit" className="recipe-search-button">
            검색
          </button>
          {searchKeyword && (
            <button 
              type="button" 
              onClick={handleClearSearch} 
              className="recipe-clear-button"
            >
              초기화
            </button>
          )}
        </form>
      </div>

      {/* ============= 테이블 컨테이너 ============= */}
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
            {currentRecipes.map((recipe, index) => (
              <tr
                key={recipe.id}
                onClick={() => handleRowClick(recipe)}
                style={{ cursor: 'pointer' }}
              >
                <td>{indexOfFirstRecipe + index + 1}</td>
                <td>{recipe.title}</td>
                <td>
                  {recipe.main_image_url ? (
                    <img 
                      src={recipe.main_image_url} 
                      alt={recipe.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <span style={{ display: 'block', color: '#999' }}>이미지 없음</span>
                  )}
                </td>
                <td>
                  {recipe.ingredients && recipe.ingredients.length > 0
                    ? recipe.ingredients.join(', ')
                    : '재료 정보 없음'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
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
      </div>

      {/* ================= 팝업 ================= */}
      {isPopupOpen && selectedRecipe && (
        <div className="popup-overlay" onClick={handleOverlayClick}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>

            {/* 상단 영역 (이미지 + 레시피 정보) */}
            <div className="top-section">

              {/* 메인 이미지 (placeholder 지원) */}
              <img
                src={selectedRecipe.completedImage || ''}
                alt={selectedRecipe.name}
                className="popup-main-image"
                onError={handleImageError}
              />

              {/* 레시피 정보 블록 */}
              <div className="recipe-info-block">
                {isEditMode ? (
                  <>
                    <input
                      type="text"
                      value={selectedRecipe.name || ''}
                      onChange={(e) => setSelectedRecipe({...selectedRecipe, name: e.target.value})}
                      placeholder="레시피 이름"
                    />
                    <label>설명</label>
                    <textarea
                      value={selectedRecipe.description || ''}
                      onChange={(e) => setSelectedRecipe({...selectedRecipe, description: e.target.value})}
                      placeholder="레시피 설명"
                    />
                  </>
                ) : (
                  <>
                    <h2>{selectedRecipe.name}</h2>
                    {selectedRecipe.description && (
                      <>
                        <h4>설명</h4>
                        <p>{selectedRecipe.description}</p>
                      </>
                    )}
                    {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                      <>
                        <h4>재료</h4>
                        <p>{selectedRecipe.ingredients.map(ing => typeof ing === 'string' ? ing : `${ing.name} ${ing.quantity || ''}`).join(', ')}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 조리 단계 */}
            <div className="cooking-steps">
              {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                selectedRecipe.steps.map((step, index) => {
                  const stepDescription = typeof step === 'string' ? step : step.description;
                  const stepImage = typeof step === 'string' 
                    ? (selectedRecipe.stepImages && selectedRecipe.stepImages[index])
                    : step.image_url;
                  
                  return (
                    <div key={index} className="step-container">
                      <div className="step-image">
                        {stepImage ? (
                          <img
                            src={stepImage}
                            alt={`${index + 1}단계`}
                            onError={handleImageError}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            이미지 없음
                          </div>
                        )}
                      </div>

                      <div className="step-content">
                        {isEditMode ? (
                          <>
                            <label>{index + 1}단계</label>
                            <textarea
                              value={stepDescription || ''}
                              onChange={(e) => {
                                const updated = [...selectedRecipe.steps];
                                if (typeof updated[index] === 'string') {
                                  updated[index] = e.target.value;
                                } else {
                                  updated[index] = { ...updated[index], description: e.target.value };
                                }
                                setSelectedRecipe({...selectedRecipe, steps: updated});
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <div className="step-number">
                              {numberToKorean(index + 1)}번째
                            </div>
                            <div className="step-description">{stepDescription}</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>조리 단계 정보가 없습니다.</p>
              )}
            </div>

            {/* ========== 팝업 하단 버튼 ========== */}
            <div className="popup-footer">

              {/* 삭제 버튼 */}
              <button className="delete-btn" onClick={handleDelete}>
                삭제
              </button>

              {/* 수정 / 저장 버튼 */}
              {!isEditMode ? (
                <button className="edit-btn" onClick={() => setIsEditMode(true)}>
                  수정
                </button>
              ) : (
                <button className="save-btn" onClick={handleSave}>
                  저장
                </button>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRecipe;