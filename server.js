// server.js (ES Modules 방식)

// 1. 필요한 모듈 가져오기 (import 구문 사용)
import 'dotenv/config'; // .env 파일 로드
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // Google AI SDK

const app = express();
const port = 3000; 

// 2. 미들웨어 설정
app.use(cors());
app.use(express.json());

// 3. SDK 클라이언트 초기화
// GEMINI_API_KEY 환경 변수가 자동으로 사용됩니다.
const ai = new GoogleGenAI({}); 

// 4. 프록시 라우터 정의
app.post('/generate-mannequin', async (req, res) => {
    // 클라이언트 (index.html)로부터 받은 요청 본문
    const clientBody = req.body; 

    // 클라이언트로부터 받은 요청 구조 (Imagen API의 'requests' 배열)를 
    // SDK의 파라미터로 변환합니다.
    if (!clientBody.requests || clientBody.requests.length === 0) {
        return res.status(400).json({ error: '유효한 요청 본문(requests)이 누락되었습니다.' });
    }
    
    // 첫 번째 요청 객체만 사용
    const requestData = clientBody.requests[0];
    const prompt = requestData.prompt;
    const config = requestData.config; 

    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 누락되었습니다.' });
    }

    try {
        // 5. Google AI SDK를 사용하여 이미지 생성 요청
        const response = await ai.models.generateImages({
            model: 'imagen-2.5-generate-002', // 🚨 모델을 안정적인 'imagen-2.5' 버전으로 변경
            prompt: prompt,
            config: {
                // SDK는 JSON 구조를 자동으로 처리해줍니다.
                numberOfImages: config.numberOfImages || 1,
                aspectRatio: config.aspectRatio || '1:1',
            }
        });

        // 6. SDK 응답을 클라이언트에게 전달 (프록시)
        // SDK 응답 구조를 REST API 응답과 유사하게 단순화하여 전달합니다.
        res.json(response); 

    } catch (error) {
        console.error('SDK 프록시 서버 오류:', error);
        
        // Google API 오류를 포함할 수 있으므로, 에러 객체를 검사하여 상세 메시지를 전달
        const status = error.code || 500;
        const message = error.message || 'SDK 서버에서 요청을 처리하지 못했습니다.';
        
        res.status(status).json({ error: message });
    }
});

// 7. 서버 시작
app.listen(port, () => {
    console.log(`SDK 프록시 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});