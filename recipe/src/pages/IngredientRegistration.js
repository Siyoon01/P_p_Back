import React, { useState, useRef, useEffect, useCallback } from 'react';
import './IngredientRegistration.css';
import Stage from '../components/Stage';
import { useNavigate } from 'react-router-dom';

function IngredientRegistration() {
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    expiry: '',
    quantity: '',
    unit: '개'
  });
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState({
    name: '',
    expiry: '',
    quantity: '',
    unit: '개'
  });
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzedIngredients, setAnalyzedIngredients] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingAnalyzedId, setEditingAnalyzedId] = useState(null);
  const [editingAnalyzedIngredient, setEditingAnalyzedIngredient] = useState({
    name: '',
    expiry: '',
    quantity: '',
    unit: '개'
  });
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const units = ['개', 'ml', 'l', 'g', 'kg'];

  const getExpiringIngredients = () => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    return ingredients.filter(ingredient => {
      if (!ingredient.expiry) return false;
      const expiryDate = new Date(ingredient.expiry);
      return expiryDate <= threeDaysLater && expiryDate >= today;
    });
  };

  const expiringIngredients = getExpiringIngredients();

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setAnalyzedIngredients([]);
        setEditingAnalyzedId(null);
      };
      reader.readAsDataURL(file);
    } else {
      alert('이미지 파일을 선택해주세요.');
    }
  };

  const handlePhotoAnalyze = async () => {
    if (!uploadedImage) {
      alert('먼저 사진을 업로드해주세요.');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call to analyze the image
    setTimeout(() => {
      const mockAnalyzedData = [
        { id: Date.now() + 1, name: '토마토', expiry: '', quantity: '', unit: '개' },
        { id: Date.now() + 2, name: '양파', expiry: '', quantity: '300', unit: 'g' },
        { id: Date.now() + 3, name: '당근', expiry: '', quantity: '', unit: '개' },
      ];
      
      setAnalyzedIngredients(mockAnalyzedData);
      setShowPhotoModal(true);
      setIsAnalyzing(false);
    }, 2000);
  };
  
  const handleModalRegister = () => {
    if (analyzedIngredients.length === 0) {
      alert('등록할 재료가 없습니다.');
      return;
    }
    
    setIngredients([...ingredients, ...analyzedIngredients]);
    
    setUploadedImage(null);
    setAnalyzedIngredients([]);
    setShowPhotoModal(false);
    setEditingAnalyzedId(null);
    setEditingAnalyzedIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditAnalyzed = (id) => {
    const ingredient = analyzedIngredients.find(item => item.id === id);
    if (ingredient) {
      setEditingAnalyzedIngredient({
        name: ingredient.name,
        expiry: ingredient.expiry,
        quantity: ingredient.quantity,
        unit: ingredient.unit
      });
      setEditingAnalyzedId(id);
    }
  };

  const handleSaveAnalyzedEdit = () => {
    if (!editingAnalyzedIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요.');
      return;
    }

    // 수량 필수 검증
    if (!editingAnalyzedIngredient.quantity || parseFloat(editingAnalyzedIngredient.quantity) <= 0) {
      alert('수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }

    const quantityToSave = parseFloat(editingAnalyzedIngredient.quantity);

    setAnalyzedIngredients(analyzedIngredients.map(ingredient =>
      ingredient.id === editingAnalyzedId
        ? { ...ingredient, ...editingAnalyzedIngredient, quantity: quantityToSave }
        : ingredient
    ));
    
    setEditingAnalyzedId(null);
    setEditingAnalyzedIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    setShowEditUnitDropdown(false);
  };

  const handleCancelAnalyzedEdit = () => {
    setEditingAnalyzedId(null);
    setEditingAnalyzedIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    setShowEditUnitDropdown(false);
  };

  const handleDeleteAnalyzed = (id) => {
    setAnalyzedIngredients(analyzedIngredients.filter(ingredient => ingredient.id !== id));
    setEditingAnalyzedId(null);
  };

  const handleManualRegister = () => {
    if (!newIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요.');
      return;
    }

    // 수량 필수 검증
    if (!newIngredient.quantity || parseFloat(newIngredient.quantity) <= 0) {
      alert('수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }

    const quantityToSave = parseFloat(newIngredient.quantity);
      
      setIngredients([...ingredients, {
        ...newIngredient,
        quantity: quantityToSave,
        id: Date.now()
      }]);
      setNewIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
      setShowUnitDropdown(false);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setNewIngredient({...newIngredient, quantity: value});
    }
  };

  const handleEditQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setEditingIngredient({...editingIngredient, quantity: value});
    }
  };

  const handleAnalyzedQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setEditingAnalyzedIngredient({...editingAnalyzedIngredient, quantity: value});
    }
  };

  const handleUnitSelect = (unit) => {
    setNewIngredient({...newIngredient, unit: unit});
    setShowUnitDropdown(false);
  };

  const handleEditUnitSelect = (unit) => {
    setEditingIngredient({...editingIngredient, unit: unit});
    setShowEditUnitDropdown(false);
  };

  const handleEditAnalyzedUnitSelect = (unit) => {
    setEditingAnalyzedIngredient({...editingAnalyzedIngredient, unit: unit});
    setShowEditUnitDropdown(false);
  };

  const removeIngredient = (id) => {
    setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    }
  };

  const handleEditIngredient = (id) => {
    const ingredientToEdit = ingredients.find(item => item.id === id);
    if (ingredientToEdit) {
      setEditingIngredient({
        name: ingredientToEdit.name,
        expiry: ingredientToEdit.expiry,
        quantity: ingredientToEdit.quantity,
        unit: ingredientToEdit.unit
      });
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editingIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요.');
      return;
    }
    
    // 수량 필수 검증
    if (!editingIngredient.quantity || parseFloat(editingIngredient.quantity) <= 0) {
      alert('수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }
    
    const quantityToSave = parseFloat(editingIngredient.quantity);

    setIngredients(ingredients.map(ingredient =>
      ingredient.id === editingId
        ? { ...ingredient, ...editingIngredient, quantity: quantityToSave }
        : ingredient
    ));
    setEditingId(null);
    setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    setShowEditUnitDropdown(false);
  };

  const handleComplete = async () => {
    if (ingredients.length === 0) {
      alert('등록할 재료가 없습니다.');
      return;
    }

    // 모든 재료의 수량 검증
    const invalidIngredients = ingredients.filter(
      ingredient => !ingredient.quantity || parseFloat(ingredient.quantity) <= 0
    );
    
    if (invalidIngredients.length > 0) {
      alert('모든 재료의 수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // 프론트엔드 형식을 백엔드 형식으로 변환
      const formattedIngredients = ingredients.map(ing => ({
        name: ing.name,
        expiryDate: ing.expiry || '', // expiry → expiryDate
        quantity_value: parseFloat(ing.quantity), // quantity → quantity_value (이미 검증 완료)
        quantity_unit: ing.unit || '개' // unit → quantity_unit
      }));

      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredients: formattedIngredients,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('재료 등록 성공:', data);
        setShowCompletionModal(true);
      } else {
        const errorData = await response.json();
        console.error('재료 등록 실패:', errorData);
        alert(errorData.message || '재료 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 중 오류:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  const handleModalClickOutside = useCallback((e) => {
    if (showPhotoModal && e.target.closest('.modal-content') === null) {
      setShowPhotoModal(false);
    }
  }, [showPhotoModal]);
  
  const handleDropdownClickOutside = useCallback((e) => {
    if (!e.target.closest('.unit-selector')) {
      setShowUnitDropdown(false);
      setShowEditUnitDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleModalClickOutside);
    document.addEventListener('mousedown', handleDropdownClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
      document.removeEventListener('mousedown', handleDropdownClickOutside);
    };
  }, [handleModalClickOutside, handleDropdownClickOutside]);

  return (
    <>
      <Stage currentstage={3} />
      
      <div className="ingredient-container">
        <h2 className="page-title">재료 등록하기</h2>
        
        <div className="register-methods">
          <div className="register-method">
            <h3>사진으로 등록하기</h3>
            <div className="photo-section">
              {uploadedImage ? (
                <div className="uploaded-image-container">
                  <img
                    src={uploadedImage}
                    alt="업로드된 이미지"
                    className="uploaded-image"
                  />
                </div>
              ) : (
                <div className="photo-upload-area" onClick={handlePhotoUpload}>
                  <div className="upload-placeholder">
                    사진 업로드
                  </div>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              
              <div className="photo-buttons">
                {uploadedImage && (
                  <button className="change-photo-btn" onClick={handlePhotoUpload}>
                    사진 변경
                  </button>
                )}
                <button
                  className="register-btn"
                  onClick={handlePhotoAnalyze}
                  disabled={!uploadedImage || isAnalyzing}
                >
                  {isAnalyzing ? '분석 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </div>
          <br /> <br />
          <div className="register-method">
            <h3>수기로 등록하기</h3>
            
            <div className="manual-form">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  placeholder="재료 이름을 입력하세요"
                  className="ingredient-input"
                />
              </div>

              <div className="form-group">
                <label>소비기한/유통기한 (선택사항)</label>
                <input
                  type="date"
                  value={newIngredient.expiry}
                  onChange={(e) => setNewIngredient({...newIngredient, expiry: e.target.value})}
                  className="ingredient-input"
                />
              </div>

              <div className="form-group">
                <label>수량 (선택사항)</label>
                <div className="quantity-input-group">
                  <input
                    type="text"
                    value={newIngredient.quantity}
                    onChange={handleQuantityChange}
                    placeholder="수량을 입력하세요"
                    className="quantity-input"
                  />
                  <div className="unit-selector">
                    <button
                      className="unit-btn"
                      onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                    >
                      {newIngredient.unit} ▼
                    </button>
                    {showUnitDropdown && (
                      <div className="unit-dropdown">
                        {units.map((unit) => (
                          <div
                            key={unit}
                            className="unit-option"
                            onClick={() => handleUnitSelect(unit)}
                          >
                            {unit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="manual-register-section">
              <button className="register-btn" onClick={handleManualRegister}>
                등록하기
              </button>
            </div>
          </div>
        </div>

        <h2 className="ingredients-title">재료 목록</h2>
        <div className="ingredients-section">
          {expiringIngredients.length > 0 && (
            <div className="expiry-warning-box">
              <h4 className="expiry-warning-title">🚨 유통기한이 임박한 재료가 있어요!</h4>
              <div className="expiry-tags">
                {expiringIngredients.map(ingredient => (
                  <span key={ingredient.id} className="expiry-tag">{ingredient.name}</span>
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 ? (
            <div className="ingredients-list">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className={`ingredient-card ${editingId === ingredient.id ? 'editing' : ''}`}>
                  {editingId === ingredient.id ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>재료 이름</label>
                        <input
                          type="text"
                          value={editingIngredient.name}
                          onChange={(e) => setEditingIngredient({
                            ...editingIngredient,
                            name: e.target.value
                          })}
                          className="ingredient-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>소비기한/유통기한</label>
                        <input
                          type="date"
                          value={editingIngredient.expiry}
                          onChange={(e) => setEditingIngredient({
                            ...editingIngredient,
                            expiry: e.target.value
                          })}
                          className="ingredient-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>수량</label>
                        <div className="quantity-input-group">
                          <input
                            type="text"
                            value={editingIngredient.quantity}
                            onChange={handleEditQuantityChange}
                            className="quantity-input"
                          />
                          <div className="unit-selector">
                            <button
                              className="unit-btn"
                              onClick={() => setShowEditUnitDropdown(!showEditUnitDropdown)}
                            >
                              {editingIngredient.unit} ▼
                            </button>
                            {showEditUnitDropdown && (
                              <div className="unit-dropdown">
                                {units.map((unit) => (
                                  <div
                                    key={unit}
                                    className="unit-option"
                                    onClick={() => handleEditUnitSelect(unit)}
                                  >
                                    {unit}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="edit-buttons">
                        <button className="save-btn" onClick={handleSaveEdit}>
                          저장
                        </button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="ingredient-info-display">
                        <div className="ingredient-name-display">{ingredient.name}</div>
                        <div className="ingredient-details">
                          <div className="ingredient-info">
                            소비기한 {ingredient.expiry ? ingredient.expiry : "미등록"}
                          </div>
                          <div className="ingredient-info">
                            수량 {ingredient.quantity ? `${ingredient.quantity} ${ingredient.unit}` : "미등록"}
                          </div>
                        </div>
                      </div>
                      <div className="ingredient-buttons">
                          <button
                            className="fridge-edit-btn"
                            onClick={() => handleEditIngredient(ingredient.id)}
                          >
                            수정
                          </button>
                          <button
                            className="fridge-delete-btn"
                            onClick={() => removeIngredient(ingredient.id)}
                          >
                            삭제
                          </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">냉장고에 재료가 없어요.</div>
          )}
        </div>

        <button className="complete-btn" onClick={handleComplete}>
          재료 등록 완료
        </button>
      </div>

      {showCompletionModal && (
        <div className="modal-overlay" onClick={() => setShowCompletionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-text">
              <p>재료가 성공적으로 등록되었습니다!</p>
              <p>이제 냉장고를 부탁해의 모든 서비스를 이용할 수 있어요.</p>
            </div>
            <div className="modal-buttons">
              <button
                className="modal-btn"
                onClick={() => navigate('/Main')}
              >
                메인 페이지로 이동하기
              </button>
              <button
                className="modal-btn"
                onClick={() => navigate('/recipe-recommendation')}
              >
                레시피 추천 받기
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="analysis-title">재료 확인하기</h2>
            <p className="analysis-subtitle">재료가 정확한지 확인하고 수정해주세요.</p>
            
            <div className="analyzed-ingredients-list">
              {analyzedIngredients.map((ingredient) => (
                <div key={ingredient.id} className="analyzed-ingredient-card">
                  {editingAnalyzedId === ingredient.id ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>재료 이름</label>
                        <input
                          type="text"
                          value={editingAnalyzedIngredient.name}
                          onChange={(e) => setEditingAnalyzedIngredient({
                            ...editingAnalyzedIngredient,
                            name: e.target.value
                          })}
                          className="ingredient-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>소비기한/유통기한</label>
                        <input
                          type="date"
                          value={editingAnalyzedIngredient.expiry}
                          onChange={(e) => setEditingAnalyzedIngredient({
                            ...editingAnalyzedIngredient,
                            expiry: e.target.value
                          })}
                          className="ingredient-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>수량</label>
                        <div className="quantity-input-group">
                          <input
                            type="text"
                            value={editingAnalyzedIngredient.quantity}
                            onChange={handleAnalyzedQuantityChange}
                            className="quantity-input"
                          />
                          <div className="unit-selector">
                            <button
                              className="unit-btn"
                              onClick={() => setShowEditUnitDropdown(!showEditUnitDropdown)}
                            >
                              {editingAnalyzedIngredient.unit} ▼
                            </button>
                            {showEditUnitDropdown && (
                              <div className="unit-dropdown">
                                {units.map((unit) => (
                                  <div
                                    key={unit}
                                    className="unit-option"
                                    onClick={() => handleEditAnalyzedUnitSelect(unit)}
                                  >
                                    {unit}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="edit-buttons">
                        <button className="save-btn" onClick={handleSaveAnalyzedEdit}>
                          저장
                        </button>
                        <button className="cancel-btn" onClick={handleCancelAnalyzedEdit}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="ingredient-info-display">
                        <div className="ingredient-name-display">{ingredient.name}</div>
                        <div className="ingredient-details">
                          <div className="ingredient-info">
                            소비기한 {ingredient.expiry ? ingredient.expiry : "미등록"}
                          </div>
                          <div className="ingredient-info">
                            수량 {ingredient.quantity ? `${ingredient.quantity} ${ingredient.unit}` : "미등록"}
                          </div>
                        </div>
                      </div>
                      <div className="ingredient-buttons">
                          <button className="fridge-edit-btn" onClick={() => handleEditAnalyzed(ingredient.id)}>
                            수정하기
                          </button>
                          <button className="fridge-delete-btn" onClick={() => handleDeleteAnalyzed(ingredient.id)}>
                            삭제하기
                          </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className="modal-register-btn"
              onClick={handleModalRegister}
            >
              등록하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default IngredientRegistration;