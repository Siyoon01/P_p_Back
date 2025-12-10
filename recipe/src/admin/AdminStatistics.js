import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminStatistics.css';

const COLORS = ['#609966', '#FFC36D', '#FF8A80', '#4ECDC4', '#45B7D1', '#AA96DA', '#FCBAD3', '#A8E6CF', '#FFD3B6', '#C7CEEA'];

function AdminStatistics() {
  const [userStats, setUserStats] = useState({ genderRatio: { male: 0, female: 0 }, ageGroups: {} });
  const [topIngredients, setTopIngredients] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          alert('로그인이 필요합니다.');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 세 API를 병렬로 호출
        const [usersRes, ingredientsRes, recipesRes] = await Promise.all([
          fetch('http://ceprj2.gachon.ac.kr:65031/api/admin/stats/users', { headers }),
          fetch('http://ceprj2.gachon.ac.kr:65031/api/admin/stats/ingredients', { headers }),
          fetch('http://ceprj2.gachon.ac.kr:65031/api/admin/stats/recipes', { headers })
        ]);

        // 사용자 통계 처리
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success && usersData.data) {
            setUserStats(usersData.data);
          }
        } else {
          console.error('사용자 통계 조회 실패:', await usersRes.json());
        }

        // 식재료 통계 처리
        if (ingredientsRes.ok) {
          const ingredientsData = await ingredientsRes.json();
          console.log('식재료 통계 응답:', ingredientsData);
          if (ingredientsData.success && ingredientsData.data) {
            console.log('식재료 데이터:', ingredientsData.data);
            // data가 배열인지 확인하고 설정
            const dataArray = Array.isArray(ingredientsData.data) ? ingredientsData.data : [];
            setTopIngredients(dataArray);
          } else {
            console.warn('식재료 데이터가 없습니다:', ingredientsData);
            setTopIngredients([]);
          }
        } else {
          const errorData = await ingredientsRes.json();
          console.error('식재료 통계 조회 실패:', errorData);
          setTopIngredients([]);
        }

        // 레시피 통계 처리 (실제 데이터)
        if (recipesRes.ok) {
          const recipesData = await recipesRes.json();
          console.log('레시피 통계 응답:', recipesData);
          if (recipesData.success && recipesData.data && Array.isArray(recipesData.data)) {
            setTopRecipes(recipesData.data);
          } else {
            console.warn('레시피 통계 데이터 형식 오류:', recipesData);
            setTopRecipes([]);
          }
        } else {
          const errorData = await recipesRes.json();
          console.error('레시피 통계 조회 실패:', errorData);
          setTopRecipes([]);
        }

      } catch (err) {
        console.error('통계 조회 오류:', err);
        setError(err.message || '통계 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // 사용자 통계 데이터 변환 (성별)
  const userStatsData = [
    { name: '남성', value: userStats.genderRatio?.male || 0, color: '#4ECDC4' },
    { name: '여성', value: userStats.genderRatio?.female || 0, color: '#FF6B6B' }
  ];

  // 연령대 데이터 변환
  const ageGroupData = [
    { age: '10대', users: userStats.ageGroups?.['10s'] || 0 },
    { age: '20대', users: userStats.ageGroups?.['20s'] || 0 },
    { age: '30대', users: userStats.ageGroups?.['30s'] || 0 },
    { age: '40대+', users: userStats.ageGroups?.['40_plus'] || 0 }
  ];

  // 식재료 데이터 변환
  const topIngredientsData = Array.isArray(topIngredients) && topIngredients.length > 0
    ? topIngredients.map((item, index) => ({
        name: item.name || item.ingredient_name || '알 수 없음',
        count: parseInt(item.count || item.registration_count || 0, 10)
      }))
    : [];

  console.log('변환된 식재료 데이터:', topIngredientsData);
  console.log('topIngredients 원본:', topIngredients);
  console.log('topIngredientsData.length:', topIngredientsData.length);

  // 레시피 데이터 변환
  const topRecipesData = topRecipes.map((item, index) => ({
    name: item.name || item.title || '알 수 없음',
    value: item.value || item.recommendationCount || item.view_count || 0,
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="admin-statistics-container">
        <h2>통계 및 분석</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-statistics-container">
        <h2>통계 및 분석</h2>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>오류: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-statistics-container">
      <h2>통계 및 분석</h2>

      <div className="statistics-grid">
        
        {/* 사용자 통계 */}
        <div className="stat-card">
          <h3>사용자 통계</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userStatsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userStatsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 가장 많이 조회된 레시피 Top10 */}
        <div className="stat-card">
          <h3>가장 많이 조회된 레시피 Top10</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topRecipesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name }) => name}
              >
                {topRecipesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 연령대별 사용자 */}
        <div className="stat-card">
          <h3>연령대별 사용자</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#FFC36D" label={{ position: 'top' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 가장 많이 등록된 식재료 Top10 */}
        <div className="stat-card">
          <h3>가장 많이 등록된 식재료 Top10</h3>
          {topIngredientsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topIngredientsData}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" label={{ position: 'top' }}>
                {topIngredientsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              등록된 식재료 데이터가 없습니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminStatistics;