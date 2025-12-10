/* 비로그인 상태의 정보 등록 페이지 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InfoRegistration.css';
import Stage from '../components/Stage';
import { useGlobalLoading } from '../components/LoadingProvider';

// state 초기 객체 생성 함수
const InitialState = (list) => {
  const initialState = {};
  list.forEach(item => {
    initialState[item] = false;
  });
  return initialState;
};

function InfoRegistration() {
  const navigate = useNavigate();
  const { show, hide } = useGlobalLoading();
  
  // 서버에서 받아올 전체 리스트 저장 state
  const [allergyList, setAllergyList] = useState([]);
  const [toolList, setToolList] = useState([]);

  // 사용자의 선택 상태 저장 state(초기값은 빈 객체)
  const [allergies, setAllergies] = useState([]);
  const [tools, setTools] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      show();
      try {
        const [allergiesRes, toolsRes] = await Promise.all([
          fetch('http://ceprj2.gachon.ac.kr:65031/api/allergies'),
          fetch('http://ceprj2.gachon.ac.kr:65031/api/tools'),
        ]);

        if (allergiesRes.ok && toolsRes.ok) {
          const allergiesData = await allergiesRes.json();
          const toolsData = await toolsRes.json();

          // 배열 ["A", "B"] 형태로 온다고 가정
          const allergyArray = allergiesData.data || allergiesData; 
          const toolArray = toolsData.data || toolsData;

          // 리스트 State 업데이트
          setAllergyList(allergyArray);
          setToolList(toolArray);

          // 선택 상태 초기화 (모두 false로 설정)
          setAllergies(InitialState(allergyArray));
          setTools(InitialState(toolArray));
        } else {
          console.error("목록을 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("API 호출 오류:", error);
      } finally {
        hide();
      }
    };

    fetchOptions();
  }, [show, hide]);
  
  // 토글 핸들러 (기존 유지)
  const toggleAllergy = (allergyName) => {
    setAllergies((prev) => ({
      ...prev,
      [allergyName]: !prev[allergyName]
    }));
  };

  const toggleTool = (toolName) => {
    setTools((prev) => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };
      
  const handleSubmit = async () => {
    
    try {
      // JWT 토큰 확인
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/Userlogin');
        return;
      }

      // 알레르기와 조리도구를 별도 API로 분리하여 호출
      const allergyArray = Object.keys(allergies).filter(key => allergies[key] === true);
      const [allergyRes, toolRes] = await Promise.all([
        fetch('http://ceprj2.gachon.ac.kr:65031/api/profile/allergies', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            allergies: allergyArray,
          }),
        }),
        fetch('http://ceprj2.gachon.ac.kr:65031/api/profile/tools', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            tools: tools,
          }),
        }),
      ]);

      if (!allergyRes.ok || !toolRes.ok) {
        const allergyError = allergyRes.ok ? null : await allergyRes.json();
        const toolError = toolRes.ok ? null : await toolRes.json();
        throw new Error(allergyError?.message || toolError?.message || '정보 등록에 실패했습니다.');
      }

      const allergyData = await allergyRes.json();
      const toolData = await toolRes.json();
      const data = { ...allergyData, ...toolData };
      console.log('정보 등록 성공:', data);
      alert('정보가 성공적으로 등록되었습니다!');
      // 다음 단계(재료 등록 페이지)로 이동
      navigate('/ingredient-registration');
    } catch (error) {
      console.error('API 호출 중 오류:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="info-registration-container">
      <Stage currentstage={2} />
      
      <div className="info-registration-content">
        <div className="form-section">
          <h1 className="infosection-title">정보 등록</h1>
          
          <div className="allergy-section">
            <label className="allergy-label">알레르기</label>
            <div className="allergies-list">
              {Object.entries(allergies).map(([allergyName, isSelected]) => (
                <button
                  key={allergyName}
                  className={`allergy-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleAllergy(allergyName)}
                  type="button"
                >
                  {allergyName}
                </button>
              ))}
            </div>
          </div>

          <div className="tools-section">
            <label className="tools-label">조리도구</label>
            <div className="tools">
              {Object.entries(tools).map(([toolName, isSelected]) => (
                <button
                  key={toolName}
                  className={`tool-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTool(toolName)}
                  type="button"
                >
                  {toolName}
                </button>
              ))}
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            정보 등록 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default InfoRegistration;