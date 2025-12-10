import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './RecipeDetail.css';

function RecipeDetail() {
  const { id } = useParams();
  const [recipeData, setRecipeData] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]); // 레시피에 필요한 재료 목록 (배열)
  const [selectedIngredients, setSelectedIngredients] = useState([]); // 사용자가 선택했던 재료들
  const [ingredientQuantities, setIngredientQuantities] = useState({}); // 재료별 수량
  const [availableIngredients, setAvailableIngredients] = useState([]); // 냉장고 재료들 (프론트엔드 표시용: { name, quantity })
  const [ingredientsData, setIngredientsData] = useState([]); // 원본 식재료 데이터 (id 포함: { id, name, quantity_value, quantity_unit, ... })
  const [additionalIngredientCount, setAdditionalIngredientCount] = useState(0); // 추가 재료 행 개수
  
  // 더미 데이터
  const dummyRecipe = {
    id: 1,
    name: '김치볶음밥',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    description: '김치와 밥을 볶아서 만드는 간단하고 맛있는 요리',
    ingredients: '김치, 밥, 계란, 대파, 참기름',
    cookingTools: '팬, 주걱, 그릇',
    steps: [
      {
        order: 1,
        title: '재료 준비하기',
        description: '김치는 적당한 크기로 썰고, 대파는 송송 썰어 준비합니다. 계란은 그릇에 풀어둡니다.',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'
      },
      {
        order: 2,
        title: '김치 볶기',
        description: '팬에 기름을 두르고 김치를 먼저 볶아 신맛을 날려줍니다.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'
      },
      {
        order: 3,
        title: '밥 넣고 볶기',
        description: '볶은 김치에 밥을 넣고 골고루 섞어가며 볶아줍니다.',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop'
      }
    ]
  };

  // 냉장고 재료 더미 데이터 (수량 포함)
  const dummyFridgeIngredients = [
    { name: '토마토', quantity: '3개' },
    { name: '양파', quantity: '2개' },
    { name: '우유', quantity: '500ml' },
    { name: '계란', quantity: '10개' },
    { name: '당근', quantity: '1개' },
    { name: '감자', quantity: '4개' },
    { name: '김치', quantity: '200g' },
    { name: '대파', quantity: '1대' },
    { name: '마늘', quantity: '5쪽' },
    { name: '생강', quantity: '50g' },
    { name: '브로콜리', quantity: '1개' },
    { name: '파프리카', quantity: '2개' },
    { name: '시금치', quantity: '100g' },
    { name: '닭고기', quantity: '300g' },
    { name: '돼지고기', quantity: '250g' },
    { name: '두부', quantity: '1모' },
    { name: '콩나물', quantity: '200g' },
    { name: '버섯', quantity: '150g' }
  ];

  // 수량 옵션 더미 데이터 - 단위만 분리
  const unitOptions = ['개', 'g', 'ml', 'L', '쪽', '대', '모', 'kg', '컵', '큰술', '작은술'];

  // 수량을 숫자와 단위로 분리하는 함수
  const parseQuantity = (quantityStr) => {
    if (!quantityStr) return { number: '', unit: '' };
    
    const match = quantityStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      return { number: match[1], unit: match[2] || '' };
    }
    return { number: '', unit: quantityStr };
  };

  // 숫자와 단위를 합쳐서 수량 문자열로 만드는 함수
  const combineQuantity = (number, unit) => {
    if (!number) return '';
    return `${number}${unit}`;
  };

  // 사용자 식재료 조회 함수
  const fetchUserIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('로그인이 필요합니다. 더미 데이터를 사용합니다.');
        setAvailableIngredients([]);
        return;
      }

      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('식재료 조회 실패');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // 원본 데이터 저장 (id 포함)
        setIngredientsData(result.data);
        
        // 백엔드 응답 형식: { id, name, quantity_value, quantity_unit, ... }
        // 프론트엔드 표시용 형식으로 변환: { name, quantity }
        const formattedIngredients = result.data.map(ing => ({
          name: ing.name,
          quantity: `${ing.quantity_value || ''}${ing.quantity_unit || ''}`.trim()
        }));
        setAvailableIngredients(formattedIngredients);
      } else {
        setIngredientsData([]);
        setAvailableIngredients([]);
      }
    } catch (error) {
      console.error('식재료 조회 오류:', error);
      setAvailableIngredients([]);
    }
  };

  // 조회수 증가 함수
  const incrementViewCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // 로그인하지 않은 사용자는 조회수 증가하지 않음
        console.log('조회 로그 저장: 로그인이 필요합니다.');
        return;
      }

      console.log(`조회 로그 저장 시작: 레시피 ID ${id}`);
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/recipes/${id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 조회 로그 저장 성공:', result.message);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 조회 로그 저장 실패:', response.status, errorData);
        // 조회수 증가 실패해도 페이지는 정상 표시
      }
    } catch (error) {
      console.error('❌ 조회 로그 저장 오류:', error);
      // 조회수 증가 실패해도 페이지는 정상 표시
    }
  };

  useEffect(() => {
    fetchRecipeDetail();
    fetchUserIngredients();
    incrementViewCount(); // 조회수 증가
    
    // URL에서 선택된 재료 정보를 가져오기 (실제로는 localStorage나 state management 사용)
    const searchParams = new URLSearchParams(window.location.search);
    const ingredients = searchParams.get('ingredients');
    if (ingredients) {
      const selectedItems = ingredients.split(',');
      setSelectedIngredients(selectedItems);
    } else {
      // 기본 선택 재료 없음 (사용자가 직접 선택하도록)
      setSelectedIngredients([]);
    }
  }, [id]);

  // availableIngredients가 변경될 때 초기 수량 설정
  useEffect(() => {
    if (availableIngredients.length > 0 && selectedIngredients.length > 0) {
      const initialQuantities = {};
      selectedIngredients.forEach((ingredient, index) => {
        const fridgeItem = availableIngredients.find(item => item.name === ingredient);
        if (fridgeItem) {
          const parsed = parseQuantity(fridgeItem.quantity);
          initialQuantities[`selected-${index}`] = {
            name: ingredient,
            number: parsed.number,
            unit: parsed.unit
          };
        }
      });
      setIngredientQuantities(initialQuantities);
    }
  }, [availableIngredients, selectedIngredients]);

  const fetchRecipeDetail = async () => {
    try {
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/recipes/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          alert('레시피를 찾을 수 없습니다.');
          return;
        }
        throw new Error('레시피 조회 실패');
      }
      const result = await response.json();
      if (result.success && result.data) {
        // 백엔드 응답 형식에 맞게 데이터 변환
        const recipe = result.data;
        
        // 재료 배열 저장 (나중에 표시용)
        const ingredientsArray = recipe.required_ingredients || [];
        setRecipeIngredients(ingredientsArray);
        
        setRecipeData({
          id: recipe.id,
          name: recipe.title,
          image: recipe.main_image_url || '',
          description: recipe.description || '',
          ingredients: ingredientsArray.length > 0
            ? ingredientsArray.map(ing => 
                (ing.quantity && ing.quantity !== 'None' && ing.quantity.trim() !== '') 
                  ? `${ing.name} ${ing.quantity}` 
                  : ing.name
              ).join(', ')
            : '',
          cookingTools: recipe.tools 
            ? recipe.tools.join(', ')
            : '',
          steps: recipe.steps 
            ? recipe.steps.map((step, index) => ({
                order: step.step_number || index + 1,
                title: `단계 ${step.step_number || index + 1}`,
                description: step.description || '',
                image: step.image_url || ''
              }))
            : []
        });
      } else {
        throw new Error(result.message || '레시피 조회 실패');
      }
    } catch (error) {
      console.error('레시피 조회 오류:', error);
      alert(error.message || '레시피를 불러오는 중 오류가 발생했습니다.');
      // 에러 발생 시 더미 데이터 사용하지 않고 로딩 상태 유지
    }
  };

  // 선택된 재료 변경
  const handleSelectedIngredientChange = (index, selectedIngredient) => {
    const ingredient = availableIngredients.find(ing => ing.name === selectedIngredient);
    if (ingredient) {
      const parsed = parseQuantity(ingredient.quantity);
      setIngredientQuantities(prev => ({
        ...prev,
        [`selected-${index}`]: {
          name: ingredient.name,
          number: parsed.number,
          unit: parsed.unit
        }
      }));
      
      // selectedIngredients 배열도 업데이트
      const newSelectedIngredients = [...selectedIngredients];
      newSelectedIngredients[index] = ingredient.name;
      setSelectedIngredients(newSelectedIngredients);
    }
  };

  // 추가 재료 선택하기 드롭다운에서 재료 선택
  const handleAdditionalIngredientSelect = (index, selectedIngredient) => {
    const ingredient = availableIngredients.find(ing => ing.name === selectedIngredient);
    if (ingredient) {
      const parsed = parseQuantity(ingredient.quantity);
      setIngredientQuantities(prev => ({
        ...prev,
        [`additional-${index}`]: {
          name: ingredient.name,
          number: parsed.number,
          unit: parsed.unit
        }
      }));
    }
  };

  // 수량 숫자 변경
  const handleNumberChange = (key, newNumber) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        number: newNumber
      }
    }));
  };

  // 단위 변경
  const handleUnitChange = (key, newUnit) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        unit: newUnit
      }
    }));
  };

  // 새로운 재료 선택 행 추가
  const addNewIngredientRow = () => {
    setAdditionalIngredientCount(prev => prev + 1);
  };

  // 재료 수량 저장
  const handleSaveQuantities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 업데이트할 재료 목록 수집
      const updates = [];
      
      // 선택된 재료들 업데이트 (quantity_value만 변경)
      Object.keys(ingredientQuantities).forEach(key => {
        if (key.startsWith('selected-') || key.startsWith('additional-')) {
          const quantityData = ingredientQuantities[key];
          if (quantityData && quantityData.name) {
            // name으로 원본 데이터에서 id 찾기
            const originalIngredient = ingredientsData.find(ing => ing.name === quantityData.name);
            if (originalIngredient) {
              // quantity_value만 변경, 나머지는 원본 값 유지
              const newQuantityValue = quantityData.number 
                ? parseFloat(quantityData.number) 
                : parseFloat(originalIngredient.quantity_value);
              
              // 값이 실제로 변경되었는지 확인
              const originalQuantityValue = parseFloat(originalIngredient.quantity_value);
              if (newQuantityValue !== originalQuantityValue) {
                updates.push({
                  id: originalIngredient.id,
                  originalIngredient: originalIngredient, // 원본 데이터 전체 저장
                  newQuantityValue: newQuantityValue
                });
              }
            }
          }
        }
      });

      if (updates.length === 0) {
        alert('변경된 재료가 없습니다.');
        return;
      }

      // 각 재료 업데이트 API 호출 (quantity_value만 변경, 나머지는 원본 값 유지)
      const updatePromises = updates.map(update => {
        const originalIngredient = update.originalIngredient;

        // 유효성 검사
        if (!update.newQuantityValue || update.newQuantityValue <= 0) {
          return Promise.reject(new Error(`수량은 0보다 큰 값이어야 합니다: ${originalIngredient.name}`));
        }

        // expiryDate를 YYYY-MM-DD 형식으로 변환
        let expiryDate = originalIngredient.expiryDate;
        if (expiryDate) {
          // Date 객체인 경우
          if (expiryDate instanceof Date) {
            const year = expiryDate.getFullYear();
            const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
            const day = String(expiryDate.getDate()).padStart(2, '0');
            expiryDate = `${year}-${month}-${day}`;
          }
          // 문자열인 경우 (이미 YYYY-MM-DD 형식이거나 다른 형식)
          else if (typeof expiryDate === 'string') {
            // YYYY-MM-DD 형식이 아닌 경우 변환 시도
            if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
              const date = new Date(expiryDate);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                expiryDate = `${year}-${month}-${day}`;
              } else {
                // 날짜 파싱 실패 시 오늘 날짜로 설정
                const today = new Date();
                expiryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              }
            }
          }
        } else {
          // expiryDate가 없으면 오늘 날짜로 설정
          const today = new Date();
          expiryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }

        // quantity_value만 변경, 나머지는 원본 값 그대로 유지
        return fetch(`http://ceprj2.gachon.ac.kr:65031/api/ingredients/${update.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: originalIngredient.name, // 원본 값 유지
            quantity_value: update.newQuantityValue, // 변경된 값만
            quantity_unit: originalIngredient.quantity_unit, // 원본 값 유지
            expiryDate: expiryDate // YYYY-MM-DD 형식으로 변환된 값
          })
        });
      });

      const responses = await Promise.allSettled(updatePromises);
      
      // 모든 응답 확인
      const results = [];
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const ingredientName = updates[i].originalIngredient.name;
        if (response.status === 'fulfilled') {
          const httpResponse = response.value;
          if (httpResponse.ok) {
            const result = await httpResponse.json();
            results.push({ success: true, name: ingredientName, data: result });
          } else {
            const errorData = await httpResponse.json();
            results.push({ success: false, name: ingredientName, error: errorData });
            console.error(`식재료 업데이트 실패 (${ingredientName}):`, errorData);
          }
        } else {
          // Promise가 reject된 경우
          results.push({ success: false, name: ingredientName, error: response.reason });
          console.error(`식재료 업데이트 실패 (${ingredientName}):`, response.reason);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (failCount === 0) {
        alert(`재료 수량이 저장되었습니다. (${successCount}개)`);
        // 업데이트 후 식재료 목록 다시 불러오기
        await fetchUserIngredients();
      } else if (successCount > 0) {
        const failNames = results.filter(r => !r.success).map(r => r.name).join(', ');
        alert(`일부 재료 저장에 실패했습니다.\n성공: ${successCount}개\n실패: ${failCount}개 (${failNames})`);
        // 일부 성공했어도 목록 새로고침
        await fetchUserIngredients();
      } else {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => {
            if (r.error && r.error.message) {
              return `${r.name}: ${r.error.message}`;
            } else if (r.error && typeof r.error === 'string') {
              return `${r.name}: ${r.error}`;
            }
            return `${r.name}: 알 수 없는 오류`;
          })
          .join('\n');
        alert(`재료 저장에 실패했습니다.\n\n${errorMessages}`);
      }
    } catch (error) {
      console.error('재료 수량 저장 오류:', error);
      alert(`재료 수량 저장 중 오류가 발생했습니다.\n${error.message || error.toString()}`);
    }
  };

  if (!recipeData) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="recipe-detail-container">
      <div className="main-content">
        {/* 레시피 기본 정보 */}
        <div className="recipe-info-section">
          <div className="recipe-image-container">
            <img src={recipeData.image} alt={recipeData.name} className="recipe-image-fixed" />
          </div>
          <div className="recipe-text-info">
            <h1 className="recipe-name">{recipeData.name}</h1>
            {recipeData.description && (
              <p className="recipe-description" style={{ 
                whiteSpace: 'normal', 
                overflow: 'visible', 
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                textOverflow: 'clip',
                maxWidth: '100%',
                minHeight: 'auto',
                maxHeight: 'none',
                height: 'auto',
                WebkitLineClamp: 'none',
                lineClamp: 'none',
                display: 'block'
              }}>
                {recipeData.description}
              </p>
            )}
            {recipeIngredients.length > 0 && (
              <div className="recipe-ingredients" style={{
                overflow: 'visible',
                maxHeight: 'none',
                height: 'auto',
                textOverflow: 'clip',
                WebkitLineClamp: 'none',
                lineClamp: 'none'
              }}>
                <strong>재료:</strong>
                <ul className="ingredients-list" style={{ 
                  marginTop: '8px', 
                  paddingLeft: '20px',
                  overflow: 'visible',
                  maxHeight: 'none',
                  height: 'auto',
                  textOverflow: 'clip',
                  WebkitLineClamp: 'none',
                  lineClamp: 'none',
                  listStyleType: 'disc',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '4px 20px'
                }}>
                  {recipeIngredients.map((ing, index) => (
                    <li key={index} style={{ 
                      marginBottom: '8px',
                      overflow: 'visible',
                      maxHeight: 'none',
                      height: 'auto',
                      textOverflow: 'clip',
                      WebkitLineClamp: 'none',
                      lineClamp: 'none',
                      whiteSpace: 'normal',
                      display: 'list-item',
                      listStylePosition: 'outside'
                    }}>
                      {ing.name} {ing.quantity && ing.quantity !== 'None' && ing.quantity.trim() !== '' && <span>({ing.quantity})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipeData.ingredients && recipeIngredients.length === 0 && (
            <div className="recipe-ingredients">
              <strong>재료:</strong> {recipeData.ingredients}
            </div>
            )}
            <div className="recipe-tools">
              <strong>조리도구:</strong> {recipeData.cookingTools}
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="section-divider"></div>

        {/* 나의 냉장고 수량 조절하기 */}
        <div className="fridge-quantity-section">
          <h2 className="section-title">나의 냉장고 수량 조절하기</h2>
          
          {/* 선택했던 재료들 */}
          {selectedIngredients.map((ingredient, index) => (
            <div key={`selected-${index}`} className="quantity-row">
              <select 
                className="ingredient-select"
                value={ingredientQuantities[`selected-${index}`]?.name || ingredient}
                onChange={(e) => handleSelectedIngredientChange(index, e.target.value)}
              >
                <option value="">재료 선택하기</option>
                {availableIngredients.map((ing, i) => (
                  <option key={i} value={ing.name}>{ing.name}</option>
                ))}
              </select>
              <div className="quantity-input-group">
                <input
                  type="number"
                  className="quantity-number-input"
                  placeholder="수량"
                  value={ingredientQuantities[`selected-${index}`]?.number || ''}
                  onChange={(e) => handleNumberChange(`selected-${index}`, e.target.value)}
                />
                <select 
                  className="unit-select"
                  value={ingredientQuantities[`selected-${index}`]?.unit || ''}
                  onChange={(e) => handleUnitChange(`selected-${index}`, e.target.value)}
                >
                  <option value="">단위</option>
                  {unitOptions.map((unit, i) => (
                    <option key={i} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* 추가 재료 선택 */}
          {Array.from({ length: additionalIngredientCount }, (_, index) => (
            <div key={`additional-${index}`} className="quantity-row">
              <select 
                className="ingredient-select"
                value={ingredientQuantities[`additional-${index}`]?.name || ''}
                onChange={(e) => handleAdditionalIngredientSelect(index, e.target.value)}
              >
                <option value="">재료 선택하기</option>
                {availableIngredients.map((ingredient, i) => (
                  <option key={i} value={ingredient.name}>{ingredient.name}</option>
                ))}
              </select>
              <div className="quantity-input-group">
                <input
                  type="number"
                  className="quantity-number-input"
                  placeholder="수량"
                  value={ingredientQuantities[`additional-${index}`]?.number || ''}
                  onChange={(e) => handleNumberChange(`additional-${index}`, e.target.value)}
                />
                <select 
                  className="unit-select"
                  value={ingredientQuantities[`additional-${index}`]?.unit || ''}
                  onChange={(e) => handleUnitChange(`additional-${index}`, e.target.value)}
                >
                  <option value="">단위</option>
                  {unitOptions.map((unit, i) => (
                    <option key={i} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* 재료 선택하기 기본 드롭다운 */}
          <div className="quantity-row">
            <select 
              className="ingredient-select"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addNewIngredientRow();
                  handleAdditionalIngredientSelect(additionalIngredientCount, e.target.value);
                }
              }}
            >
              <option value="">재료 선택하기</option>
              {availableIngredients.map((ingredient, i) => (
                <option key={i} value={ingredient.name}>{ingredient.name}</option>
              ))}
            </select>
            <div className="placeholder-quantity-group">
              <span className="placeholder-text">수량과 단위를 선택하세요</span>
            </div>
          </div>

          <div className="save-button-container">
            <button className="save-button" onClick={handleSaveQuantities}>저장</button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="section-divider"></div>

        {/* 조리 순서 */}
        <div className="cooking-steps-section">
          <h2 className="section-title">조리 순서</h2>
          {recipeData.steps.map((step, index) => (
            <div key={index} className="cooking-step">
              <img src={step.image} alt={`${step.order}번째 단계`} className="step-image" />
              <div className="step-content">
                <h3 className="step-order">{step.order}번째</h3>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;