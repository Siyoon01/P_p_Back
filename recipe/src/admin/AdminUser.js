import React, { useState, useEffect } from 'react';
import './AdminUser.css';

function AdminUser() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allergyOptions, setAllergyOptions] = useState([]);
  const [cookingToolOptions, setCookingToolOptions] = useState([]);

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          alert('로그인이 필요합니다.');
          return;
        }

        const response = await fetch('http://ceprj2.gachon.ac.kr:65031/api/admin/users', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '사용자 목록을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        if (data.success && data.data) {
          // 백엔드 응답 형식에 맞게 변환
          const formattedUsers = data.data.map(user => {
            // 성별 변환: 'male' -> '남자', 'female' -> '여자'
            const genderDisplay = user.gender === 'male' ? '남자' : user.gender === 'female' ? '여자' : user.gender || '';
            
            return {
              id: user.id,
              nickname: user.nickname || '',
              userId: user.userID || user.userId || '',
              name: user.fullName || '',
              birthdate: user.birthdate || '',
              gender: genderDisplay,
              role: user.role === 'admin' ? '관리자' : '사용자',
              status: '활성', // 기본값 (백엔드에 status 필드가 없으면 활성으로 표시)
              allergies: [],
              cookingTools: []
            };
          });
          setUsers(formattedUsers);
        }
      } catch (err) {
        console.error('사용자 목록 조회 오류:', err);
        const errorMessage = err.message || '사용자 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
        // 'Failed to fetch'는 네트워크 오류이므로 더 자세한 메시지 표시
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          alert('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        } else {
          alert(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 알레르기 및 조리도구 옵션 가져오기
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [allergiesRes, toolsRes] = await Promise.all([
          fetch('http://ceprj2.gachon.ac.kr:65031/api/allergies'),
          fetch('http://ceprj2.gachon.ac.kr:65031/api/tools')
        ]);

        if (allergiesRes.ok && toolsRes.ok) {
          const allergiesData = await allergiesRes.json();
          const toolsData = await toolsRes.json();
          
          // 백엔드 응답 형식에 맞게 처리
          const allergyArray = allergiesData.data || allergiesData;
          const toolArray = toolsData.data || toolsData;
          
          // 배열이면 name 필드 추출, 아니면 그대로 사용
          setAllergyOptions(
            Array.isArray(allergyArray) 
              ? allergyArray.map(a => (typeof a === 'string' ? a : a.name || a))
              : []
          );
          setCookingToolOptions(
            Array.isArray(toolArray)
              ? toolArray.map(t => (typeof t === 'string' ? t : t.name || t))
              : []
          );
        }
      } catch (err) {
        console.error('옵션 조회 오류:', err);
      }
    };

    fetchOptions();
  }, []);

  const usersPerPage = 10;

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleRowClick = async (user) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 사용자 상세 정보 가져오기
      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/admin/users/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const userDetails = data.data;
        // 성별 변환: 'male' -> '남자', 'female' -> '여자'
        const genderDisplay = user.gender === 'male' ? '남자' : user.gender === 'female' ? '여자' : user.gender || '';
        
    setSelectedUser({
      ...user,
          gender: genderDisplay, // 성별을 한글로 변환
          allergies: userDetails.allergies || [],
          cookingTools: userDetails.tools || []
    });
    setShowModal(true);
      }
    } catch (err) {
      console.error('사용자 상세 정보 조회 오류:', err);
      alert(err.message || '사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

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

  const handleInputChange = (field, value) => {
    // 생년월일 필드인 경우 유효성 검증 적용
    if (field === 'birthdate') {
      const validatedValue = validateBirthdate(value);
      setSelectedUser({
        ...selectedUser,
        [field]: validatedValue
      });
    } else {
    setSelectedUser({
      ...selectedUser,
      [field]: value
    });
    }
  };

  const toggleAllergy = (allergy) => {
    const allergies = selectedUser.allergies || [];
    if (allergies.includes(allergy)) {
      setSelectedUser({
        ...selectedUser,
        allergies: allergies.filter(a => a !== allergy)
      });
    } else {
      setSelectedUser({
        ...selectedUser,
        allergies: [...allergies, allergy]
      });
    }
  };

  const toggleCookingTool = (tool) => {
    const tools = selectedUser.cookingTools || [];
    if (tools.includes(tool)) {
      setSelectedUser({
        ...selectedUser,
        cookingTools: tools.filter(t => t !== tool)
      });
    } else {
      setSelectedUser({
        ...selectedUser,
        cookingTools: [...tools, tool]
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 조리도구 정보를 객체 형태로 변환
      const toolsObject = {};
      cookingToolOptions.forEach(tool => {
        toolsObject[tool] = (selectedUser.cookingTools || []).includes(tool);
      });

      // 생년월일 유효성 검증
      if (!selectedUser.birthdate || selectedUser.birthdate.length !== 6) {
        alert("생년월일은 6자리(YYMMDD)로 입력해주세요.");
        return;
      }
      const mm = parseInt(selectedUser.birthdate.substring(2, 4), 10);
      const dd = parseInt(selectedUser.birthdate.substring(4, 6), 10);
      if (mm < 1 || mm > 12) {
        alert("월(MM)은 01~12 사이의 값이어야 합니다.");
        return;
      }
      if (dd < 1 || dd > 31) {
        alert("일(DD)은 01~31 사이의 값이어야 합니다.");
        return;
      }

      // 모든 정보를 한 번에 전송
      const updateData = {
        nickname: selectedUser.nickname,
        fullName: selectedUser.name,
        birthdate: selectedUser.birthdate,
        gender: selectedUser.gender === '남자' ? 'male' : selectedUser.gender === '여자' ? 'female' : selectedUser.gender,
        allergies: selectedUser.allergies || [],
        tools: toolsObject
      };

      console.log('[Frontend] 업데이트 데이터:', updateData);
      console.log('[Frontend] 알레르기:', updateData.allergies);
      console.log('[Frontend] 조리도구 객체:', updateData.tools);

      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보 수정에 실패했습니다.');
      }

      // 사용자 목록 새로고침
      const usersResponse = await fetch('http://ceprj2.gachon.ac.kr:65031/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success && usersData.data) {
          const formattedUsers = usersData.data.map(user => {
            // 성별 변환: 'male' -> '남자', 'female' -> '여자'
            const genderDisplay = user.gender === 'male' ? '남자' : user.gender === 'female' ? '여자' : user.gender || '';
            
            return {
              id: user.id,
              nickname: user.nickname || '',
              userId: user.userID || user.userId || '',
              name: user.fullName || '',
              birthdate: user.birthdate || '',
              gender: genderDisplay,
              role: user.role === 'admin' ? '관리자' : '사용자',
              status: '활성',
              allergies: [],
              cookingTools: []
            };
    });
          setUsers(formattedUsers);
        }
      }

    alert('수정이 완료되었습니다.');
    handleCloseModal();
    } catch (err) {
      console.error('사용자 정보 수정 오류:', err);
      alert(err.message || '사용자 정보 수정에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 계정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`http://ceprj2.gachon.ac.kr:65031/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '계정 삭제에 실패했습니다.');
      }

      // 사용자 목록에서 제거
      setUsers(users.filter(user => user.id !== selectedUser.id));
      alert('계정이 삭제되었습니다.');
      handleCloseModal();
    } catch (err) {
      console.error('계정 삭제 오류:', err);
      alert(err.message || '계정 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="admin-user-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-user-page">
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-user-page">
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>닉네임</th>
              <th>아이디</th>
              <th>계정 상태</th>
              <th>사용자/관리자</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id} onClick={() => handleRowClick(user)} style={{ cursor: 'pointer' }}>
                <td>{user.id}</td>
                <td>{user.nickname}</td>
                <td>{user.userId}</td>
                <td>
                  <span className={`status-badge ${user.status === '활성' ? 'active' : 'inactive'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.role}</td>
              </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            {/* 회원 기본 정보 수정 */}
            <div className="modal-section">
              <div className="section-header">
                <h3 className="admin-section-title">회원 기본 정보 수정</h3>
                <div className="admin-section-line"></div>
              </div>
              
              <div className="form-group">
                <label>아이디 (수정 불가)</label>
                <input 
                  type="text" 
                  value={selectedUser.userId}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>
              
              <div className="form-group">
                <label>닉네임</label>
                <input 
                  type="text" 
                  value={selectedUser.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="form-group">
                <label>이름</label>
                <input 
                  type="text" 
                  value={selectedUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="홍길동"
                />
              </div>

              <div className="form-group">
                <label>생년월일</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength="6"
                  value={selectedUser.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  placeholder="YYMMDD"
                />
                <small>생년월일은 6자리(YYMMDD)로 입력해주세요. 월(MM): 01~12, 일(DD): 01~31</small>
              </div>

              <div className="form-group">
                <label>성별</label>
                <div className="admin-gender-buttons">
                  <button 
                    className={`admin-gender-button ${selectedUser.gender === '남자' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('gender', '남자')}
                  >
                    남자
                  </button>
                  <button 
                    className={`admin-gender-button ${selectedUser.gender === '여자' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('gender', '여자')}
                  >
                    여자
                  </button>
                </div>
              </div>
            </div>

            {/* 회원 상세 정보 수정 */}
            <div className="modal-section">
              <div className="section-header">
                <h3 className="admin-section-title">회원 상세 정보 수정</h3>
                <div className="admin-section-line"></div>
              </div>
              
              <div className="form-group">
                <label>알레르기</label>
                <div className="tag-container">
                  {allergyOptions.map(allergy => (
                    <button
                      key={allergy}
                      className={`tag-btn allergy ${selectedUser.allergies?.includes(allergy) ? 'selected' : ''}`}
                      onClick={() => toggleAllergy(allergy)}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>조리도구</label>
                <div className="tag-container">
                  {cookingToolOptions.map(tool => (
                    <button
                      key={tool}
                      className={`tag-btn cooking-tool ${selectedUser.cookingTools?.includes(tool) ? 'selected' : ''}`}
                      onClick={() => toggleCookingTool(tool)}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-delete" onClick={handleDelete}>
                계정 삭제
              </button>
              <button className="btn-update" onClick={handleUpdate}>
                수정 완료
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUser;
