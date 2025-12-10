// 파일 경로: src/models/RecipeViewLog.model.js

const { pool } = require('../../server');

// --- 1. 조회 기록 저장소 (Repository) ---
class RecipeViewLogRepository {

    /**
     * POST /api/recipes/:id/view
     * 레시피 조회 기록을 생성합니다. (조회 시점 기록)
     */
    static async createLog(userId, recipeId) {
        try {
            const insertQuery = `
                INSERT INTO recipe_view_logs (user_id, recipe_id) 
                VALUES (?, ?)
            `;
            const [result] = await pool.execute(insertQuery, [userId, recipeId]);
            
            return result.insertId;
        } catch (error) {
            console.error('RecipeViewLogRepository.createLog 오류:', error);
            const err = new Error('조회 기록 저장 중 DB 오류가 발생했습니다.');
            err.code = 500;
            throw err;
        }
    }

    /**
     * GET /api/recipes/history 구현을 위해
     * 특정 사용자의 최근 조회 기록을 레시피 정보와 함께 조회합니다.
     * (중복 제거 및 최종 조회 시간 기준으로 정렬)
     */
    static async findDistinctRecentViews(userId, limit = 10) {
        try {
            // limit를 정수로 변환
            const limitNum = parseInt(limit, 10);
            const userIdNum = parseInt(userId, 10);
            
            if (isNaN(userIdNum) || userIdNum <= 0) {
                console.error('RecipeViewLogRepository.findDistinctRecentViews: 잘못된 userId:', userId);
                return [];
            }
            
            if (isNaN(limitNum) || limitNum <= 0) {
                console.warn('RecipeViewLogRepository.findDistinctRecentViews: 잘못된 limit, 기본값 10 사용:', limit);
                limitNum = 10;
            }
            
            // NOTE: 중복 조회 레시피 중 가장 최근 조회된 시간(MAX(viewed_at))을 기준으로 정렬
            // MySQL ONLY_FULL_GROUP_BY 모드 호환을 위해 서브쿼리 사용
            // LIMIT은 MySQL2 파라미터 바인딩 이슈로 인해 직접 삽입 (숫자로 검증됨)
            console.log(`RecipeViewLogRepository.findDistinctRecentViews: 쿼리 실행 시작 (userId: ${userIdNum}, limit: ${limitNum})`);
            
            // LIMIT은 숫자로 검증된 후 직접 삽입 (SQL injection 방지를 위해 parseInt로 검증)
            const safeLimit = Math.max(1, Math.min(limitNum, 1000)); // 1~1000 사이로 제한
            
            const query = `
                SELECT 
                    r.id AS id, 
                    r.title,
                    r.main_image_url,
                    recent.last_viewed_at
                FROM (
                    SELECT 
                        rvl.recipe_id,
                    MAX(rvl.viewed_at) AS last_viewed_at
                FROM recipe_view_logs rvl
                WHERE rvl.user_id = ?
                    GROUP BY rvl.recipe_id
                    ORDER BY MAX(rvl.viewed_at) DESC
                    LIMIT ${safeLimit}
                ) AS recent
                JOIN recipes r ON recent.recipe_id = r.id
                ORDER BY recent.last_viewed_at DESC;
            `;
            
            console.log('실행할 쿼리:', query.replace(/\s+/g, ' ').trim());
            console.log('쿼리 파라미터:', [userIdNum]);
            
            // NOTE: RecipeViewLogRepository는 RecipeRepository에서 호출되어 사용됨
            // LIMIT을 직접 삽입했으므로 userId만 파라미터로 전달
            const [rows] = await pool.execute(query, [userIdNum]);
            
            console.log(`RecipeViewLogRepository.findDistinctRecentViews: 사용자 ${userIdNum}의 조회 기록 ${rows?.length || 0}건 조회`);
            return rows || [];
        } catch (error) {
            console.error('RecipeViewLogRepository.findDistinctRecentViews 오류:', error);
            console.error('에러 메시지:', error.message);
            console.error('에러 코드:', error.code);
            console.error('에러 SQL 상태:', error.sqlState);
            console.error('에러 SQL 메시지:', error.sqlMessage);
            console.error('에러 스택:', error.stack);
            
            // 실제 DB 오류 메시지를 포함하여 에러 전달
            const errorMessage = error.sqlMessage || error.message || '조회 기록 목록 생성 중 오류가 발생했습니다.';
            const err = new Error(`조회 기록 목록 생성 중 오류가 발생했습니다: ${errorMessage}`);
            err.code = error.code || 500;
            err.originalError = error;
            throw err;
        }
    }
}

module.exports = {
    RecipeViewLogRepository
};