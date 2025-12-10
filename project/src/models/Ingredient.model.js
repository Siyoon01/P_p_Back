// 파일 경로: src/models/Ingredient.model.js

const { pool } = require('../../server');
const { IngredientMasterRepository } = require('./IngredientMaster.model');

// --- 1. 식재료 데이터 클래스 (반환 객체 구조) ---
class Ingredient {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.expiryDate = data.expiryDate;
        this.quantity_value = data.quantity_value;
        this.quantity_unit = data.quantity_unit;
        this.createdAt = data.createAt; // DB 컬럼명에 맞춤
    }

    // API 응답 시 사용
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            name: this.name,
            expiryDate: this.expiryDate,
            quantity_value: parseFloat(this.quantity_value), // API 명세에 따라 숫자로 변환
            quantity_unit: this.quantity_unit,
            createdAt: this.createdAt
        };
    }
}

// --- 2. 식재료 저장소 (Repository) ---
class IngredientRepository {

    /**
     * 식재료 1건을 생성합니다. (POST /api/ingredients)
     * ingredients_master 테이블에 없으면 자동으로 추가합니다.
     * 동일한 식재료(name, expiryDate, quantity_unit)가 이미 있으면 수량을 더합니다.
     */
    static async create(userId, data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { name, expiryDate, quantity_value, quantity_unit } = data;
            
            // 1. ingredients_master 테이블에 식재료가 없으면 추가
            await IngredientMasterRepository.findOrCreateByName(name, connection);
            
            // 2. 동일한 식재료가 이미 있는지 확인 (user_id, name만 같으면 동일)
            const [existingRows] = await connection.execute(
                `SELECT id, quantity_value FROM ingredients 
                 WHERE user_id = ? AND name = ?`,
                [userId, name]
            );
            
            if (existingRows.length > 0) {
                // 동일한 식재료가 있으면 수량을 더하고, 소비기한과 단위를 업데이트
                const existingId = existingRows[0].id;
                const existingQuantity = parseFloat(existingRows[0].quantity_value);
                const newQuantity = existingQuantity + parseFloat(quantity_value);
                
                const updateQuery = `
                    UPDATE ingredients 
                    SET quantity_value = ?, expiryDate = ?, quantity_unit = ?
                    WHERE id = ?
                `;
                await connection.execute(updateQuery, [newQuantity, expiryDate, quantity_unit, existingId]);
                
                await connection.commit();
                connection.release();
                
                return this.findById(existingId);
            } else {
                // 동일한 식재료가 없으면 새로 추가
                const insertQuery = `
                    INSERT INTO ingredients (user_id, name, expiryDate, quantity_value, quantity_unit) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                const [result] = await connection.execute(insertQuery, [userId, name, expiryDate, quantity_value, quantity_unit]);
                
                await connection.commit();
                connection.release();
                
                return this.findById(result.insertId);
            }
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('IngredientRepository.create 오류:', error);
            const err = new Error("식재료 등록 중 DB 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * 여러 식재료를 일괄 등록합니다. (POST /api/ingredients/bulk)
     * ingredients_master 테이블에 없으면 자동으로 추가합니다.
     * 동일한 식재료(name, expiryDate, quantity_unit)가 이미 있으면 수량을 더합니다.
     */
    static async createBulk(userId, ingredients) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            let insertedCount = 0;
            let updatedCount = 0;
            
            // 각 식재료에 대해 처리
            for (const ing of ingredients) {
                const { name, expiryDate, quantity_value, quantity_unit } = ing;
                
                // 1. ingredients_master 테이블에 식재료가 없으면 추가
                await IngredientMasterRepository.findOrCreateByName(name, connection);
                
                // 2. 동일한 식재료가 이미 있는지 확인 (user_id, name만 같으면 동일)
                const [existingRows] = await connection.execute(
                    `SELECT id, quantity_value FROM ingredients 
                     WHERE user_id = ? AND name = ?`,
                    [userId, name]
                );
                
                if (existingRows.length > 0) {
                    // 동일한 식재료가 있으면 수량을 더하고, 소비기한과 단위를 업데이트
                    const existingId = existingRows[0].id;
                    const existingQuantity = parseFloat(existingRows[0].quantity_value);
                    const newQuantity = existingQuantity + parseFloat(quantity_value);
                    
                    const updateQuery = `
                        UPDATE ingredients 
                        SET quantity_value = ?, expiryDate = ?, quantity_unit = ?
                        WHERE id = ?
                    `;
                    await connection.execute(updateQuery, [newQuantity, expiryDate, quantity_unit, existingId]);
                    updatedCount++;
                } else {
                    // 동일한 식재료가 없으면 새로 추가
                    const insertQuery = `
                        INSERT INTO ingredients (user_id, name, expiryDate, quantity_value, quantity_unit) 
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    await connection.execute(insertQuery, [userId, name, expiryDate, quantity_value, quantity_unit]);
                    insertedCount++;
                }
            }
            
            await connection.commit();
            connection.release();
            
            // 새로 추가된 개수와 업데이트된 개수의 합 반환
            return insertedCount + updatedCount;
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('IngredientRepository.createBulk 오류:', error);
            const err = new Error("식재료 일괄 등록 처리 중 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * ID로 식재료 1건을 조회합니다.
     */
    static async findById(id) {
        try {
            const query = 'SELECT * FROM ingredients WHERE id = ?';
            const [rows] = await pool.execute(query, [id]);
            
            return rows.length === 0 ? null : new Ingredient(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 사용자별 식재료 목록을 조회합니다. (GET /api/ingredients)
     */
    static async findByUserId(userId) {
        try {
            const query = 'SELECT * FROM ingredients WHERE user_id = ? ORDER BY expiryDate ASC';
            const [rows] = await pool.execute(query, [userId]);
            
            return rows.map(row => new Ingredient(row).toJSON());
        } catch (error) {
            console.error('IngredientRepository.findByUserId 오류:', error);
            const err = new Error("식재료 목록 조회 중 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * 식재료 정보를 수정합니다. (PUT /api/ingredients/:id, 소유권 확인 포함)
     * 이름이 변경된 경우 ingredients_master 테이블에 없으면 자동으로 추가합니다.
     */
    static async update(userId, ingredientId, updateData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { name, expiryDate, quantity_value, quantity_unit } = updateData;
            
            // 1. 이름이 변경된 경우 ingredients_master 테이블에 없으면 추가
            if (name) {
                await IngredientMasterRepository.findOrCreateByName(name, connection);
            }
            
            // 2. ingredients 테이블 업데이트
            const updateQuery = `
                UPDATE ingredients 
                SET name = ?, expiryDate = ?, quantity_value = ?, quantity_unit = ?
                WHERE id = ? AND user_id = ?
            `;
            
            const [result] = await connection.execute(updateQuery, [
                name, expiryDate, quantity_value, quantity_unit, ingredientId, userId
            ]);

            await connection.commit();
            connection.release();

            // 소유권 없음 또는 ID 없음 오류 처리
            if (result.affectedRows === 0) {
                 return null; // Controller에서 404/403 처리 위임
            }
            
            return this.findById(ingredientId);
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('IngredientRepository.update 오류:', error);
            const err = new Error("식재료 수정 처리 중 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * 식재료를 삭제합니다. (DELETE /api/ingredients/:id, 소유권 확인 포함)
     */
    static async delete(userId, ingredientId) {
        try {
            const deleteQuery = 'DELETE FROM ingredients WHERE id = ? AND user_id = ?';
            const [result] = await pool.execute(deleteQuery, [ingredientId, userId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('IngredientRepository.delete 오류:', error);
            const err = new Error("식재료 삭제 처리 중 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * 요리에 사용된 식재료들을 보유 목록에서 차감합니다. (POST /api/ingredients/consume, 트랜잭션 사용)
     */
    static async consumeBulk(userId, consumptionList) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            for (const item of consumptionList) {
                const { id, quantity_value: req_value, quantity_unit: req_unit } = item;

                // 1. 현재 재고 조회 및 소유권 확인
                const [currentRows] = await connection.execute(
                    'SELECT quantity_value, quantity_unit FROM ingredients WHERE id = ? AND user_id = ? FOR UPDATE',
                    [id, userId] // FOR UPDATE로 락(lock) 걸기
                );

                if (currentRows.length === 0) {
                    const err = new Error(`식재료 ID ${id}를 찾을 수 없습니다.`);
                    err.code = 404; throw err; 
                }
                
                const current = currentRows[0];
                const current_value = parseFloat(current.quantity_value); // DECIMAL 타입이 문자열로 올 수 있으므로 파싱
                
                // 2. 단위 및 재고 확인
                if (current.quantity_unit !== req_unit) {
                    const err = new Error(`식재료 ID ${id}의 단위(${current.quantity_unit})와 요청 단위(${req_unit})가 다릅니다.`);
                    err.code = 400; throw err;
                }

                if (current_value < req_value) {
                    const err = new Error(`식재료 ID ${id} (${current_value} ${req_unit} 보유)의 수량이 부족합니다.`);
                    err.code = 602; throw err; // 602: 재고 부족
                }
                
                // 3. 재고 차감 및 업데이트/삭제
                const newQuantity = current_value - req_value;
                
                if (newQuantity <= 0) {
                    await connection.execute('DELETE FROM ingredients WHERE id = ?', [id]);
                } else {
                    await connection.execute('UPDATE ingredients SET quantity_value = ? WHERE id = ?', [newQuantity, id]);
                }
            }

            await connection.commit();
            return true;
            
        } catch (error) {
            await connection.rollback();
            console.error('IngredientRepository.consumeBulk 트랜잭션 오류:', error);
            // 400/404 오류는 Controller로 전달
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * AI 추천 시스템에 필요한 사용자의 보유 식재료 ID 목록을 조회합니다.
     * @deprecated 이 메서드는 사용자 식재료 테이블의 ID를 반환합니다. 마스터 ID가 필요하면 getOwnedIngredientMasterIds를 사용하세요.
     */
    static async getOwnedIngredientIds(userId) {
        try {
            const query = `
                SELECT id FROM ingredients 
                WHERE user_id = ?
            `;
            const [rows] = await pool.execute(query, [userId]);
            
            // 보유 ID 배열 (숫자) 반환
            return rows.map(row => row.id);
        } catch (error) {
            console.error('IngredientRepository.getOwnedIngredientIds 오류:', error);
            throw error;
        }
    }

    /**
     * AI 추천 시스템에 필요한 사용자의 보유 식재료 마스터 ID 목록을 조회합니다.
     * 사용자가 보유한 식재료 이름을 ingredients_master 테이블의 ID로 변환합니다.
     * @param {number} userId - 사용자 ID
     * @returns {Array<number>} 보유 식재료 마스터 ID 배열
     */
    static async getOwnedIngredientMasterIds(userId) {
        try {
            // 1. 사용자가 보유한 식재료 이름 목록 조회
            const [ingredientRows] = await pool.execute(
                'SELECT DISTINCT name FROM ingredients WHERE user_id = ?',
                [userId]
            );
            
            if (ingredientRows.length === 0) return [];
            
            const ingredientNames = ingredientRows.map(row => row.name);
            
            // 2. ingredients_master 테이블에서 해당 이름들의 ID 조회
            const placeholders = ingredientNames.map(() => '?').join(',');
            const [masterRows] = await pool.execute(
                `SELECT id FROM ingredients_master WHERE name IN (${placeholders})`,
                ingredientNames
            );
            
            return masterRows.map(row => row.id);
        } catch (error) {
            console.error('IngredientRepository.getOwnedIngredientMasterIds 오류:', error);
            throw error;
        }
    }

    /**
     * 소비기한이 임박한 식재료 목록을 조회합니다. (조회 시점으로부터 3일 이내)
     * GET /api/ingredients/expiring
     */
    static async findExpiringIngredients(userId) {
        try {
            // 오늘 날짜와 3일 후 날짜 계산
            const today = new Date();
            today.setHours(0, 0, 0, 0); // 오늘 00:00:00
            
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(today.getDate() + 3); // 3일 후 23:59:59
            threeDaysLater.setHours(23, 59, 59, 999);
            
            // 날짜를 YYYY-MM-DD 형식으로 변환
            const todayStr = today.toISOString().split('T')[0];
            const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
            
            const query = `
                SELECT * FROM ingredients 
                WHERE user_id = ? 
                AND expiryDate >= ? 
                AND expiryDate <= ?
                ORDER BY expiryDate ASC
            `;
            const [rows] = await pool.execute(query, [userId, todayStr, threeDaysLaterStr]);
            
            return rows.map(row => new Ingredient(row).toJSON());
        } catch (error) {
            console.error('IngredientRepository.findExpiringIngredients 오류:', error);
            const err = new Error("소비기한 임박 식재료 조회 중 오류가 발생했습니다.");
            err.code = 500;
            throw err;
        }
    }

    /**
     * GET /api/admin/stats/ingredients
     * role이 "user"인 사용자들이 등록한 식재료 중 가장 많이 등록된 식재료 Top N을 조회합니다.
     * @param {number} limit - 상위 몇 개를 조회할지 제한
     */
    static async getTopRegisteredIngredients(limit = 10) {
        try {
            // ingredients 테이블과 users 테이블을 조인하여 role이 "user"인 사용자만 필터링
            // name 컬럼으로 그룹화하여 COUNT
            // LIMIT는 파라미터 바인딩 대신 쿼리 문자열에 직접 포함 (MySQL2의 LIMIT 파라미터 바인딩 이슈 방지)
            const limitValue = parseInt(limit, 10) || 10;
            const query = `
                SELECT 
                    i.name,
                    COUNT(i.id) AS count
                FROM ingredients i
                INNER JOIN users u ON i.user_id = u.id
                WHERE u.role = 'user'
                  AND i.name IS NOT NULL 
                  AND i.name != ''
                GROUP BY i.name
                ORDER BY count DESC
                LIMIT ${limitValue}
            `;
            const [rows] = await pool.execute(query);
            
            console.log(`[IngredientRepository] Top ${limit} 식재료 조회 결과:`, rows);
            
            return rows.map(row => ({
                name: row.name,
                count: parseInt(row.count, 10)
            }));
        } catch (error) {
            console.error('IngredientRepository.getTopRegisteredIngredients 오류:', error);
            const err = new Error('식재료 통계 조회 중 오류가 발생했습니다.');
            err.code = 500;
            throw err;
        }
    }
}

module.exports = {
    IngredientRepository,
    Ingredient 
};