import React from 'react';
import { useState, useEffect } from 'react';
import { useGlobalLoading } from '../components/LoadingProvider';
import './Mypage.css';

// state 초기 객체 생성 함수
const InitialState = (list) => {
  const initialState = {};
  list.forEach(item => {
    initialState[item] = false;
  });
  return initialState;
};

function Mypage() {
  const [basicInfo, setBasicInfo] = useState({
    gender: '',
    btd: '',
    name:'',
    nickname: '',
    username: '',
    password: '', // 비밀번호 확인용 (수정 불가능)
  });

// 전체 목록 저장 State
  const [allergyList, setAllergyList] = useState([]);
  const [toolList, setToolList] = useState([]);

  // 2. 선택 상태 State
  const [allergies, setAllergies] = useState({});
  const [tools, setTools] = useState({});

  const {show, hide} = useGlobalLoading();

  // 데이터 불러오기
  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      show();
      try {
        const token = localStorage.getItem('token');
        
        // API 호출 (전체 알레르기, 전체 도구, 사용자 프로필, 사용자 선택 알레르기/조리도구)
        const [allergiesRes, toolsRes, profileRes, userAllergiesRes, userToolsRes] = await Promise.all([
            fetch('http://ceprj2.gachon.ac.kr:65031/api/allergies'),
            fetch('http://ceprj2.gachon.ac.kr:65031/api/tools'),
            fetch('http://ceprj2.gachon.ac.kr:65031/api/user/profile', {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            }),
            fetch('http://ceprj2.gachon.ac.kr:65031/api/profile/allergies', {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            }),
            fetch('http://ceprj2.gachon.ac.kr:65031/api/profile/tools', {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            })
        ]);
        if (!alive) return;

        // 전체 목록 설정
        if (allergiesRes.ok && toolsRes.ok) {
            const allergiesData = await allergiesRes.json();
            const toolsData = await toolsRes.json();
            
            // 마스터 데이터에서 name 배열 추출
            const allAllergies = (allergiesData.data || allergiesData).map(item => item.name || item); 
            const allTools = (toolsData.data || toolsData).map(item => item.name || item);

            setAllergyList(allAllergies);
            setToolList(allTools);

            // 모든 항목 false로 초기화
            const initialAllergies = InitialState(allAllergies);
            const initialTools = InitialState(allTools);

            // 사용자 프로필 정보 설정
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                if (profileData.success && profileData.data) {
                    const user = profileData.data;
                    setBasicInfo({
                        gender: user.gender || '',
                        btd: user.birthdate || '',
                        name: user.fullName || '',
                        nickname: user.nickname || '',
                        username: user.userID || user.userId || '', // 백엔드는 userID로 반환
                        password: '', // 비밀번호 확인용 (수정 불가능)
                    });
                }
            }

            // 사용자가 선택한 알레르기와 조리도구 설정
            if (userAllergiesRes.ok && userToolsRes.ok) {
                const userAllergiesData = await userAllergiesRes.json();
                const userToolsData = await userToolsRes.json();
                
                const selectedAllergies = (userAllergiesData.data || []).map(item => item.name || item);
                const selectedTools = (userToolsData.data || []).map(item => item.name || item);
                
                // 선택된 항목만 true로 설정
                const userAllergies = { ...initialAllergies };
                selectedAllergies.forEach(name => {
                    userAllergies[name] = true;
                });
                
                const userTools = { ...initialTools };
                selectedTools.forEach(name => {
                    userTools[name] = true;
                });
                
                setAllergies(userAllergies);
                setTools(userTools);
            } else {
                // 사용자 선택 정보가 없으면 초기값 사용
                setAllergies(initialAllergies);
                setTools(initialTools);
            }
        }

      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        hide();
      }
    };

    fetchData();

    return () => { alive = false; };
  }, [show, hide]);

  // 생년월일 유효성 검증 함수
  const validateBirthdate = (value) => {
    // 숫자만 입력 가능
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 6) return numericValue.slice(0, 6);
    
    // 6자리 미만이면 그대로 반환
    if (numericValue.length < 6) return numericValue;
    
    // 6자리인 경우 MM과 DD 검증
    const mm = parseInt(numericValue.substring(2, 4), 10);
    const dd = parseInt(numericValue.substring(4, 6), 10);
    
    // MM이 01~12 범위를 벗어나면 마지막 입력 무시
    if (mm < 1 || mm > 12) {
      return numericValue.slice(0, 4); // YYMM까지만 유지
    }
    
    // DD가 01~31 범위를 벗어나면 마지막 입력 무시
    if (dd < 1 || dd > 31) {
      return numericValue.slice(0, 5); // YYMMD까지만 유지
    }
    
    return numericValue;
  };

  // 기본 정보 입력값 변경 핸들러
  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    
    // 생년월일 필드인 경우 유효성 검증 적용
    if (name === 'btd') {
      const validatedValue = validateBirthdate(value);
      setBasicInfo((prev) => ({ ...prev, [name]: validatedValue }));
    } else {
    setBasicInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

// 알레르기 토글 핸들러
  const toggleAllergy = (allergyName) => {
    setAllergies((prev) => ({
      ...prev,
      [allergyName]: !prev[allergyName]
    }));
  };

  // 조리도구 토글 핸들러
  const toggleTool = (toolName) => {
    setTools((prev) => ({
      ...prev,
      [toolName]: !prev[toolName]
    }));
  };

  // 폼 제출 핸들러 (기본 정보 수정)
  const handleBasicSubmit = async (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(새로고침) 방지
    
    console.log('기본 정보 수정 제출 데이터:', basicInfo); 

    const {gender, btd, name, nickname, password} = basicInfo;

    // 비밀번호 확인 필수
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    // 생년월일 유효성 검증
    if (btd.length !== 6) {
      alert("생년월일은 6자리(YYMMDD)로 입력해주세요.");
      return;
    }
    const mm = parseInt(btd.substring(2, 4), 10);
    const dd = parseInt(btd.substring(4, 6), 10);
    if (mm < 1 || mm > 12) {
      alert("월(MM)은 01~12 사이의 값이어야 합니다.");
      return;
    }
    if (dd < 1 || dd > 31) {
      alert("일(DD)은 01~31 사이의 값이어야 합니다.");
      return;
    }

    try {
      // localStorage에서 JWT 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/Userlogin';
        return;
      }

      // DB 업데이트 API 구현 - 백엔드의 /api/user/profile 엔드포인트 사용
      // 비밀번호는 변경 불가능, 비밀번호 확인용으로만 사용
      // userID는 수정 불가능하므로 제외
      const updatePayload = {
        gender: basicInfo.gender,
        birthdate: basicInfo.btd,
        fullName: basicInfo.name,
        nickname: basicInfo.nickname,
        currentPassword: basicInfo.password, // 비밀번호 확인용 (필수)
      };

      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`, // JWT 토큰 추가
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '기본 정보 수정에 실패했습니다.');
      }

      console.log('기본 정보 수정 성공:', result);
      alert('기본 정보가 성공적으로 수정되었습니다!');

      // 성공 후 비밀번호 입력 필드 초기화
      setBasicInfo(prev => ({
        ...prev,
        password: '',
      }));

    } catch (error) {
      console.error('기본 정보 수정 중 오류 발생:', error);
      alert(error.message || '기본 정보 수정에 실패했습니다.');
    }
  };

  // 폼 제출 핸들러 (상세 정보 수정)
  const handleDetailSubmit = async (e) => {
    e.preventDefault();

    const detailData = { allergies, tools };
    console.log('상세 정보 수정 제출 데이터:', detailData);

    try {
      // JWT 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/Userlogin';
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
        throw new Error(allergyError?.message || toolError?.message || '상세 정보 수정에 실패했습니다.');
      }

      const allergyResult = await allergyRes.json();
      const toolResult = await toolRes.json();
      console.log('상세 정보 수정 성공:', { allergyResult, toolResult });
      alert('상세 정보가 성공적으로 수정되었습니다!');

    } catch (error) {
      console.error('상세 정보 수정 중 오류 발생:', error);
      alert('상세 정보 수정에 실패했습니다.');
    }
  };

  // 모달 열림 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 탈퇴 비밀번호 입력 상태
  const [withdrawPassword, setWithdrawPassword] = useState('');

  // 모달 열기
  const openModal = () => setIsModalOpen(true);
  // 모달 닫기
  const closeModal = () => {
    setWithdrawPassword('');
    setIsModalOpen(false);
  };

  // 회원 탈퇴 실행 핸들러
  const handleWithdrawConfirm = async () => {
    if (!withdrawPassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    // API 호출로 탈퇴 처리
    console.log('탈퇴 비밀번호:', withdrawPassword);

     try {
      const token = localStorage.getItem('token');
      // API 호출로 탈퇴 처리
      const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/user/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Authorization 헤더에 토큰 추가
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: withdrawPassword }), // 탈퇴 시 비밀번호 확인
      });

      if (!response.ok) {
        const errorData = await response.json(); // 서버에서 보낸 에러 메시지
        throw new Error(errorData.message || '회원 탈퇴에 실패했습니다.');
      }

      alert('회원 탈퇴가 성공적으로 처리되었습니다.');
      // 탈퇴 성공 후 비로그인 메인 페이지로 리디렉션
      window.location.href = '/home'; 
      closeModal();

    } catch (error) {
      console.error('회원 탈퇴 중 오류 발생:', error);
      alert(`회원 탈퇴에 실패했습니다: ${error.message}`);
    }
  };
  
  return (
    <div className='MypageContainer'>
      <section className="BasicUserContainer">
        <h2>회원 기본 정보 수정</h2>
        <form onSubmit={handleBasicSubmit}>
          <label htmlFor="nick">닉네임</label>
          <input 
          id="nick"
          name="nickname" 
          type="text" 
          value={basicInfo.nickname} 
          onChange={handleBasicChange} />

          <label htmlFor="id">아이디</label>
          <input 
          id="id"
          name="username"
          type="text" 
          value={basicInfo.username} 
          onChange={handleBasicChange} />
          
          <label htmlFor="password">비밀번호 확인 (필수)</label>
          <input
            id="password"
            name="password"
            type="password"
            value={basicInfo.password}
            onChange={handleBasicChange}
            placeholder="정보 수정을 위해 비밀번호를 입력하세요"
            required />
          
          <label htmlFor="name">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            value={basicInfo.name}
            onChange={handleBasicChange}
            placeholder="이름을 입력하세요"
            required />
          
          <label htmlFor="btd">생년월일</label>
          <input
            id="btd"
            name="btd"
            type="text"
            inputMode="numeric"
            maxLength="6"
            value={basicInfo.btd}
            onChange={handleBasicChange}
            placeholder="생년월일 6자리(YYMMDD)를 입력하세요."
            pattern="\d{6}"
            required />
            
          <fieldset className="gender-group">
            <legend>성별</legend>
              <input
              id="gender-male"
              name="gender"
              type="radio"
              value="male"
              checked={basicInfo.gender === 'male'}
              onChange={handleBasicChange}
              required
              className='gender-input'
            />
            <label htmlFor="gender-male" className='gender-label'>남성</label>

            <input
              id="gender-female"
              name="gender"
              type="radio"
              value="female"
              checked={basicInfo.gender === 'female'}
              onChange={handleBasicChange}
              required
              className='gender-input'
            />
          <label htmlFor="gender-female" className='gender-label'>여성</label>
        </fieldset>
          <button type="submit" className="mypage-submit-button">수정 완료</button>
        </form>
      </section>
      <section className='DetailUserContainer'>
        <h2>회원 상세 정보 수정</h2>
        <form onSubmit={handleDetailSubmit}>
          <label>알레르기</label>
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
          <label>조리도구</label>
            <div className="tools">
              {Object.entries(tools).map(([toolName, isSelected]) => (
                <button
                    key={toolName}
                    className={`tool-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTool(toolName)}
                    type="button"
                  >{toolName}
                </button>
            ))}
            </div>
            <button type="submit" className='mypage-submit-button'>수정 완료</button>
        </form>
      </section>
      <button onClick={openModal} className="withdraw-btn">회원 탈퇴</button>
      {/* 탈퇴 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="withdraw-modal-content" onClick={e => e.stopPropagation()}>
            <h3>회원 탈퇴를 원하시면 하단에 비밀번호를 입력해주세요.</h3>
            <input
              id="withdraw-password"
              type="password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
            <div className='withdraw-buttons'>
             <button className="confirm-btn" onClick={handleWithdrawConfirm}>회원 탈퇴</button>
            <button className="turnback-btn" onClick={closeModal}>돌아가기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mypage;