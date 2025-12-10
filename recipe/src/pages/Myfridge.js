import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Myfridge.css';
import { useGlobalLoading } from '../components/LoadingProvider';
import { useNavigate } from 'react-router-dom';

function Myfridge() {
  const [ingredients, setIngredients] = useState([]);
  const [approachingExpiries, setApproachingExpiries] = useState([]);
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

  // ISO 날짜 형식을 YYYY-MM-DD로 변환하는 헬퍼 함수
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // ISO 형식 (2025-12-03T15:00:00.000Z) 또는 YYYY-MM-DD 형식 모두 처리
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  // 소비기한 임박 식재료는 백엔드 API에서 조회하므로 클라이언트 계산 제거

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
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        setIsAnalyzing(false);
        return;
      }

      // 파일 객체 가져오기
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        alert('파일을 선택해주세요.');
        setIsAnalyzing(false);
        return;
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('image', file);

      // POST /api/images/upload - 이미지 업로드 및 분석 요청
      const uploadResponse = await fetch('http://ceprj2.gachon.ac.kr:65031/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || '이미지 업로드에 실패했습니다.');
      }

      const analysisId = uploadData.data?.id;
      if (!analysisId) {
        throw new Error('분석 ID를 받지 못했습니다.');
      }

      // Polling으로 분석 결과 조회
      let attempts = 0;
      const maxAttempts = 30; // 최대 30초 대기 (1초 간격)
      
      const pollAnalysisResult = async () => {
        const resultResponse = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/images/analysis/${analysisId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const resultData = await resultResponse.json();

        if (!resultResponse.ok) {
          throw new Error(resultData.message || '분석 결과 조회에 실패했습니다.');
        }

        const status = resultData.data?.status?.toUpperCase();

        if (status === 'COMPLETED') {
          // 분석 완료: detections를 식재료 목록으로 변환
          const detections = resultData.data?.identified_ingredients || [];
          
          if (detections.length === 0) {
            alert('이미지에서 식재료를 찾을 수 없습니다.');
            setIsAnalyzing(false);
            return;
          }

          // detections 형식: [{ classId, label, bbox, confidence }]
          // 프론트엔드 형식으로 변환: [{ id, name, expiry, quantity, unit }]
          const formattedIngredients = detections.map((detection, index) => ({
            id: Date.now() + index,
            name: detection.label || detection.name || '',
            expiry: '',
            quantity: '',
            unit: '개'
          }));

          setAnalyzedIngredients(formattedIngredients);
          setShowPhotoModal(true);
          setIsAnalyzing(false);
        } else if (status === 'FAILED') {
          throw new Error(resultData.data?.error_message || '이미지 분석에 실패했습니다.');
        } else if (status === 'PENDING' || status === 'PROCESSING') {
          // 아직 분석 중이면 다시 시도 (PENDING 또는 PROCESSING 상태)
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
          }
          setTimeout(pollAnalysisResult, 1000); // 1초 후 다시 조회
        } else {
          // 알 수 없는 상태
          console.warn('알 수 없는 분석 상태:', status);
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
          }
          setTimeout(pollAnalysisResult, 1000); // 1초 후 다시 조회
        }
      };

      // 첫 번째 polling 시작
      await pollAnalysisResult();

    } catch (error) {
      console.error('이미지 분석 중 오류:', error);
      alert(error.message || '이미지 분석 중 오류가 발생했습니다.');
      setIsAnalyzing(false);
    }
  };
  
  const handleModalRegister = async () => {
    if (analyzedIngredients.length === 0) {
      alert('등록할 재료가 없습니다.');
      return;
    }
    
    // 모든 재료의 수량 검증
    const invalidIngredients = analyzedIngredients.filter(
      ingredient => !ingredient.quantity || parseFloat(ingredient.quantity) <= 0
    );
    
    if (invalidIngredients.length > 0) {
      alert('모든 재료의 수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        return;
      }

      // 분석된 재료들을 백엔드 API로 등록
      const promises = analyzedIngredients.map(async (ingredient) => {
        const expiryDate = ingredient.expiry || new Date().toISOString().split('T')[0];
        // 수량 필수 (이미 검증 완료)
        const quantityValue = parseFloat(ingredient.quantity);
        const quantityUnit = ingredient.unit || '개';

        const requestBody = {
          name: ingredient.name.trim(),
          expiryDate: expiryDate,
          quantity_value: quantityValue,
          quantity_unit: quantityUnit
        };

        const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '재료 등록에 실패했습니다.');
        }

        return await response.json();
      });

      await Promise.all(promises);
      
      // 등록 성공 후 UI 초기화 및 목록 새로고침
      setUploadedImage(null);
      setAnalyzedIngredients([]);
      setShowPhotoModal(false);
      setEditingAnalyzedId(null);
      setEditingAnalyzedIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('재료가 등록되었습니다.');
      // 등록 성공 후 목록 다시 조회
      await fetchIngredientLists(false);
    } catch (error) {
      console.error('재료 등록 중 오류:', error);
      alert(error.message || '재료 등록 중 오류가 발생했습니다.');
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

  const handleManualRegister = async () => {
    if (!newIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요.');
      return;
    }

    // 수량 필수 검증
    if (!newIngredient.quantity || parseFloat(newIngredient.quantity) <= 0) {
      alert('수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        return;
      }

      // 백엔드 API 형식에 맞게 데이터 변환
      // 필수 필드: name, expiryDate, quantity_value, quantity_unit
      // 소비기한이 없으면 오늘 날짜로 설정 (백엔드 필수 필드)
      const expiryDate = newIngredient.expiry || new Date().toISOString().split('T')[0];
      
      // 수량 필수 (이미 검증 완료)
      const quantityValue = parseFloat(newIngredient.quantity);
      
      // 단위가 없으면 '개'로 설정 (백엔드 필수 필드)
      const quantityUnit = newIngredient.unit || '개';

      const requestBody = {
        name: newIngredient.name.trim(),
        expiryDate: expiryDate,
        quantity_value: quantityValue,
        quantity_unit: quantityUnit
      };

      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setNewIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
        setShowUnitDropdown(false);
        alert('재료가 등록되었습니다.');
        // 등록 성공 후 목록 다시 조회
        await fetchIngredientLists(false);
      } else {
        console.error('재료 등록 실패:', data);
        alert(data.message || '재료 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 중 오류:', error);
      alert('서버와 연결할 수 없습니다.');
    }
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

  const removeIngredient = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        return;
      }

      // DELETE /api/ingredients/:id - 식재료 삭제
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (editingId === id) {
          setEditingId(null);
          setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
        }
        alert('재료가 삭제되었습니다.');
        // 삭제 성공 후 목록 다시 조회
        await fetchIngredientLists(false);
      } else {
        console.error('재료 삭제 실패:', data);
        alert(data.message || '재료 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 중 오류:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  const handleEditIngredient = (id) => {
    const ingredientToEdit = ingredients.find(item => item.id === id);
    if (ingredientToEdit) {
      // 소비기한이 있으면 그대로 사용, 없으면 빈 문자열
      // date input은 YYYY-MM-DD 형식이어야 함
      const expiryValue = ingredientToEdit.expiry || '';
      
      setEditingIngredient({
        name: ingredientToEdit.name || '',
        expiry: expiryValue,
        quantity: ingredientToEdit.quantity || '',
        unit: ingredientToEdit.unit || '개'
      });
      setEditingId(id);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingIngredient.name.trim()) {
      alert('재료 이름을 입력해주세요.');
      return;
    }

    // 수량 필수 검증
    if (!editingIngredient.quantity || parseFloat(editingIngredient.quantity) <= 0) {
      alert('수량을 입력해주세요. 수량은 0보다 큰 값이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        return;
      }

      // 백엔드 API 형식에 맞게 데이터 변환
      // 필수 필드: name, expiryDate, quantity_value, quantity_unit
      const expiryDate = editingIngredient.expiry || new Date().toISOString().split('T')[0];
      
      // 수량 필수 (이미 검증 완료)
      const quantityValue = parseFloat(editingIngredient.quantity);
      
      // 단위가 없으면 '개'로 설정 (백엔드 필수 필드)
      const quantityUnit = editingIngredient.unit || '개';

      const requestBody = {
        name: editingIngredient.name.trim(),
        expiryDate: expiryDate,
        quantity_value: quantityValue,
        quantity_unit: quantityUnit
      };

      // PUT /api/ingredients/:id - 식재료 수정
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/ingredients/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingId(null);
        setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
        alert('재료가 수정되었습니다.');
        // 수정 성공 후 목록 다시 조회
        await fetchIngredientLists(false);
      } else {
        console.error('재료 수정 실패:', data);
        alert(data.message || '재료 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 중 오류:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingIngredient({ name: '', expiry: '', quantity: '', unit: '개' });
    setShowEditUnitDropdown(false);
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

  const { show, hide } = useGlobalLoading();

  // 식재료 목록과 소비기한 임박 목록을 조회하는 함수
  const fetchIngredientLists = async (showLoading = true) => {
    try {
      if (showLoading) show();
      const token = localStorage.getItem('token');
      if (!token) {
        setIngredients([]);
        setApproachingExpiries([]);
        if (showLoading) hide();
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
        const text = await res.text().catch(() => '');
        throw new Error(`냉장고 데이터를 불러오지 못했어요: ${res.status} - ${text}`);
      }
      
      const data = await res.json();

      // 백엔드 응답 형식: { success: true, data: [...] }
      const list = Array.isArray(data?.data) ? data.data : [];
      
      // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
      const formattedIngredients = list.map(item => ({
        id: item.id,
        name: item.name,
        expiry: formatDateForInput(item.expiryDate), // expiryDate → expiry (ISO 형식을 YYYY-MM-DD로 변환)
        quantity: item.quantity_value > 0 ? String(item.quantity_value) : '', // quantity_value → quantity
        unit: item.quantity_unit // quantity_unit → unit
      }));
      
      setIngredients(formattedIngredients);

      // GET /api/ingredients/expiring - 소비기한 임박 식재료 조회
      const expiringRes = await fetch('http://ceprj2.gachon.ac.kr:65031/api/ingredients/expiring', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (expiringRes.ok) {
        const expiringData = await expiringRes.json();
        const expiringList = Array.isArray(expiringData?.data) ? expiringData.data : [];
        
        // 백엔드 데이터 형식을 프론트엔드 형식으로 변환
        const formattedExpiring = expiringList.map(item => ({
          id: item.id,
          name: item.name,
          expiry: formatDateForInput(item.expiryDate),
          quantity: item.quantity_value > 0 ? String(item.quantity_value) : '',
          unit: item.quantity_unit
        }));
        
        setApproachingExpiries(formattedExpiring);
      }
    } catch (e) {
      console.error(e);
      alert('냉장고 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setIngredients([]);
      setApproachingExpiries([]);
    } finally {
      if (showLoading) hide();
    }
  };

  useEffect(() => {
    let alive = true;
    fetchIngredientLists(true).then(() => {
      if (!alive) return;
    });
    return () => { alive = false; };
  }, [show, hide]);

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
      <div className="ingredient-container">
        <h2 className="page-title">재료 등록하기</h2>
        
        <div className="myfridge-register-methods">
          <div className="myfridge-register-method">
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

          <div className="divider"></div>

          <div className="myfridge-register-method">
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
          {approachingExpiries.length > 0 && (
            <div className="expiry-warning-box">
              <h4 className="expiry-warning-title">🚨 유통기한이 임박한 재료가 있어요!</h4>
              <div className="expiry-tags">
                {approachingExpiries.map(ingredient => (
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
      </div>

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

export default Myfridge;