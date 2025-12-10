// 파일 경로: src/utils/logger.js
// 로그 시스템

const fs = require('fs');
const path = require('path');

// 로그 파일 경로
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'recipe_service.log');

// 로그 디렉토리 생성 (없으면)
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 현재 시간을 로그 형식으로 포맷팅
 * @returns {string} YYYY-MM-DD HH:MM:SS.ms 형식
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 로그 레벨 정의
 */
const LOG_LEVELS = {
    ERROR: { level: 0, format: 'ERROR' },
    WARN: { level: 1, format: 'WARN' },
    INFO: { level: 2, format: 'INFO' }
};

/**
 * 로그를 파일에 기록
 * @param {string} level - 로그 레벨 (ERROR, WARN, INFO)
 * @param {string} context - 컨텍스트 (예: [User:1], [Req:abc123])
 * @param {string} message - 로그 메시지
 */
function writeLog(level, context, message) {
    const timestamp = getTimestamp();
    const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    const logLine = `${timestamp} [${logLevel.format}] ${context} - ${message}\n`;
    
    // 콘솔에도 출력 (개발 편의성)
    console.log(logLine.trim());
    
    // 파일에 추가 (동기 방식으로 변경하여 확실히 기록)
    try {
        // 로그 디렉토리 확인 및 생성
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        
        // 파일에 쓰기
        fs.appendFileSync(LOG_FILE, logLine, 'utf8');
        
        // 파일이 실제로 쓰여졌는지 확인 (에러 발생 시)
        if (level === 'ERROR') {
            const stats = fs.statSync(LOG_FILE);
            if (!stats.isFile()) {
                console.error('로그 파일이 정상적인 파일이 아닙니다:', LOG_FILE);
            }
        }
    } catch (err) {
        // 에러를 콘솔과 별도 에러 파일에 기록
        const errorMsg = `[${new Date().toISOString()}] 로그 파일 쓰기 실패: ${err.message}\n경로: ${LOG_FILE}\n스택: ${err.stack}\n`;
        console.error(errorMsg);
        
        // 에러 로그를 별도 파일에 기록 시도
        try {
            const errorLogFile = path.join(LOG_DIR, 'logger_error.log');
            fs.appendFileSync(errorLogFile, errorMsg, 'utf8');
        } catch (errorLogErr) {
            console.error('에러 로그 파일 쓰기도 실패:', errorLogErr);
        }
    }
}

/**
 * ERROR 레벨 로그 (레벨 0)
 * @param {string} context - 컨텍스트
 * @param {string} message - 메시지
 */
function error(context, message) {
    writeLog('ERROR', context, message);
}

/**
 * WARN 레벨 로그 (레벨 1)
 * @param {string} context - 컨텍스트
 * @param {string} message - 메시지
 */
function warn(context, message) {
    writeLog('WARN', context, message);
}

/**
 * INFO 레벨 로그 (레벨 2)
 * @param {string} context - 컨텍스트
 * @param {string} message - 메시지
 */
function info(context, message) {
    writeLog('INFO', context, message);
}

module.exports = {
    error,
    warn,
    info,
    LOG_LEVELS
};

