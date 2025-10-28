# 나노바나나 이미지 편집 GUI 앱 개발 가이드

이 문서는 n8n 워크플로우 로직을 기반으로 독립적인 데스크톱 또는 웹 기반 GUI 애플리케이션을 개발하기 위한 기술적인 설계 및 구현 가이드입니다.

## 1. 애플리케이션 구조 설계 (Application Architecture)

애플리케이션은 사용자 인터페이스를 제공하는 **프론트엔드(Frontend)**와 핵심 로직을 처리하는 **백엔드(Backend)**로 구성된 클라이언트-서버 모델을 따릅니다.

### 1.1. 전체 워크플로우
```
+----------------+      +----------------------+      +--------------------+
|                |      |                      |      |                    |
|   프론트엔드    |  1.  |       백엔드         |  2.  |    OpenRouter AI   |
|   (GUI App)    |----->|     (API 서버)       |----->|   (Gemini Model)   |
|                |      |                      |      |                    |
+----------------+      +----------------------+      +--------------------+
      ^             (이미지, 텍스트 요청) (생성된 프롬프트) |
      |                                                    | 3. (생성된 이미지)
      | 5. (결과 표시)                                     |
      |                                                    v
      |      +----------------------+      +--------------------+
      |      |                      |      |                    |
      +------|       백엔드         | <----+                    |
             |     (API 서버)       |  4.  |   Google Drive     |
             |                      |----->|     (스토리지)     |
             +----------------------+      +--------------------+
                                        (이미지 업로드)
```

### 1.2. 컴포넌트별 역할

#### 1.2.1. 프론트엔드 (Frontend)
- **역할**: 사용자 상호작용을 담당합니다. 사용자가 이미지를 업로드하고, 텍스트를 입력하며, 최종 결과를 확인할 수 있는 그래픽 인터페이스를 제공합니다.
- **주요 기능**:
    - 이미지 파일 입력 (레퍼런스, 원본 - 선택사항)
    - 텍스트 요청 입력 (필수)
    - '실행' 버튼 클릭 시 백엔드 API로 모든 데이터를 전송
    - 백엔드로부터 처리 상태(로딩, 완료, 오류)를 받아 표시
    - 최종 생성된 이미지를 화면에 표시하거나 다운로드 링크 제공

#### 1.2.2. 백엔드 (Backend) - API 서버
- **역할**: 애플리케이션의 핵심 두뇌 역할을 합니다. 프론트엔드로부터 받은 데이터를 처리하고, 외부 서비스(AI 모델, 클라우드 스토리지)와 통신하며, 비즈니스 로직을 수행합니다.
- **주요 기능**:
    - **API 엔드포인트 제공**: 프론트엔드로부터 HTTP 요청을 받을 수 있는 API (`/generate-image`)를 제공합니다.
    - **입력 데이터 처리**: 업로드된 이미지 파일을 Base64와 같은 형식으로 인코딩합니다.
    - **조건부 로직 수행**: 입력된 이미지 유무에 따라 `image_exist` 상태 ("reference image exists", "source image exists", "image does not exist")를 판단합니다.
    - **AI 프롬프트 생성**: `image_exist` 상태와 사용자 텍스트를 조합하여 OpenRouter의 Gemini 모델에 보낼 최종 영어 프롬프트를 동적으로 생성합니다.
    - **외부 API 호출**: 생성된 프롬프트와 이미지 데이터를 포함하여 OpenRouter API를 호출합니다.
    - **결과 처리**: OpenRouter로부터 받은 응답에서 결과 이미지 데이터(Base64)를 추출합니다.
    - **클라우드 스토리지 연동**: 추출된 이미지 데이터를 파일로 변환하여 Google Drive에 업로드합니다.
    - **응답 반환**: 처리 결과를 프론트엔드에 반환합니다 (예: Google Drive 링크, 이미지 데이터 등).

## 2. GUI 화면 상세 정의 (GUI Layout Definition)

애플리케이션의 프론트엔드(GUI)는 사용자가 쉽고 직관적으로 이미지 편집/생성을 요청할 수 있도록 다음 요소들을 포함해야 합니다.

### 2.1. 화면 구성 요소

| ID (for development) | 컴포넌트 타입 | 레이블 (한국어) | 설명 | 필수 여부 |
| --- | --- | --- | --- | --- |
| `title` | `Label` / `Header` | **나노바나나 이미지 편집** | 애플리케이션의 제목 | 필수 |
| `description` | `Label` / `Text` | 이미지 편집에 필요한 정보를 입력해주세요. | 앱의 목적을 설명하는 부제 | 필수 |
| `ref_image_upload` | `File Uploader` | **레퍼런스 이미지** | 스타일, 구도 등을 참고할 이미지. | 선택 |
| `src_image_upload` | `File Uploader` | **원본 이미지** | 편집할 대상이 되는 원본 이미지. | 선택 |
| `request_text` | `Text Area` | **요청사항** | AI에게 전달할 구체적인 편집 또는 생성 지시사항. (예: "배경을 우주로 바꿔주세요") | **필수** |
| `submit_button` | `Button` | **이미지 생성/편집 실행** | 모든 입력을 완료하고 백엔드에 작업을 요청하는 버튼. | 필수 |
| `status_indicator` | `Label` / `Spinner` | (초기: 없음) | 작업 처리 중 상태를 표시. (예: "이미지 생성 중...", "오류: ...") | 필수 |
| `result_image` | `Image View` | (초기: 없음) | 최종 결과 이미지를 표시하는 영역. | 필수 |
| `download_link` | `Link` / `Button` | (초기: 없음) | 결과 이미지를 다운로드할 수 있는 링크 또는 버튼. | 선택 |

### 2.2. 화면 레이아웃 예시 (Mockup)

```
+-----------------------------------------------------------------+
|                                                                 |
|   나노바나나 이미지 편집                                          |
|   이미지 편집에 필요한 정보를 입력해주세요.                         |
|                                                                 |
|   +---------------------+      +---------------------+          |
|   |  레퍼런스 이미지    |      |  원본 이미지        |          |
|   | (파일 선택/드래그)  |      | (파일 선택/드래그)  |          |
|   | [선택사항]          |      | [선택사항]          |          |
|   +---------------------+      +---------------------+          |
|                                                                 |
|   요청사항 [필수]                                               |
|   +---------------------------------------------------------+   |
|   |                                                         |   |
|   | 배경을 AI/자동화에 어울리는 느낌으로 변경해줘             |   |
|   |                                                         |   |
|   +---------------------------------------------------------+   |
|                                                                 |
|                  [ 이미지 생성/편집 실행 ]                      |
|                                                                 |
|   -----------------------------------------------------------   |
|                                                                 |
|   상태: 이미지 생성 중... (spinner)                             |
|                                                                 |
|   +---------------------------------------------------------+   |
|   |                                                         |   |
|   |             (결과 이미지가 표시될 영역)                   |   |
|   |                                                         |   |
|   +---------------------------------------------------------+   |
|                                                                 |
|                       [ 다운로드 ]                              |
|                                                                 |
+-----------------------------------------------------------------+
```

## 3. 백엔드 로직 및 구현 예제 (Backend Logic & Implementation)

백엔드 서버는 Python과 Flask 프레임워크를 사용하여 구현하는 것을 권장합니다. 간단하고 빠르게 API 서버를 구축할 수 있습니다.

### 3.1. 권장 기술 스택 (Recommended Tech Stack)
- **언어 (Language):** Python 3.8+
- **웹 프레임워크 (Web Framework):** Flask
- **HTTP 요청 라이브러리 (HTTP Client):** `requests`
- **Google Drive 연동:** `google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib`
- **환경 변수 관리 (Environment Variables):** `python-dotenv`

### 3.2. 프로젝트 구조 예시 (Project Structure)
```
/nanobanana-image-app
|-- app.py                 # 메인 애플리케이션 파일
|-- requirements.txt       # 필요한 파이썬 패키지 목록
|-- .env                     # API 키 등 환경 변수 저장
|-- credentials.json       # Google Drive API 인증을 위한 서비스 계정 키 파일
```

### 3.3. 환경 설정 (Setup)

1.  **가상 환경 생성 및 활성화:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # macOS/Linux
    # venv\Scripts\activate   # Windows
    ```

2.  **`requirements.txt` 파일 작성:**
    ```
    Flask
    requests
    python-dotenv
    google-api-python-client
    google-auth-httplib2
    google-auth-oauthlib
    ```

3.  **패키지 설치:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **`.env` 파일 생성 및 API 키 설정:**
    ```
    OPENROUTER_API_KEY="sk-or-..."
    GOOGLE_DRIVE_FOLDER_ID="..."
    ```

5.  **Google Drive API 설정:**
    - Google Cloud Platform에서 프로젝트를 생성하고, Google Drive API를 활성화합니다.
    - 서비스 계정(Service Account)을 생성하고, JSON 키 파일을 다운로드하여 `credentials.json`으로 저장합니다.
    - Google Drive에서 업로드할 폴더를 만들고, 해당 폴더의 공유 설정에서 생성한 서비스 계정의 이메일 주소를 '편집자'로 추가합니다.
    - 위에서 만든 폴더의 ID를 `.env` 파일의 `GOOGLE_DRIVE_FOLDER_ID`에 입력합니다.

### 3.4. 메인 애플리케이션 코드 (`app.py`)

아래는 전체 로직을 포함하는 `app.py`의 전체 코드 예제입니다. 각 함수는 n8n 워크플로우의 노드 하나에 해당하는 기능을 수행합니다.

```python
import os
import base64
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
import time

# .env 파일에서 환경 변수 로드
load_dotenv()

# Flask 앱 초기화
app = Flask(__name__)

# --- 환경 변수 및 상수 ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
# OpenRouter에서 지원하는 최신 Vision 모델 확인 필요
GEMINI_MODEL = "google/gemini-pro-vision"

# --- Google Drive API 설정 ---
SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'credentials.json'

def get_drive_service():
    """Google Drive API 서비스 객체를 생성하고 반환합니다."""
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('drive', 'v3', credentials=creds)
    return service

# --- 핵심 로직 함수들 ---

def generate_ai_prompt(request_text, image_exist_status):
    """입력된 정보에 따라 AI 프롬프트를 동적으로 생성합니다."""
    # 원본 요구사항은 OpenAI를 사용하여 프롬프트를 '생성'하는 것이었지만,
    # 여기서는 비용 효율적인 규칙 기반으로 직접 생성합니다.
    base_prompt = f"Based on the user request: '{request_text}', "

    if image_exist_status == "reference image exists":
        prompt = base_prompt + "edit the source image to match the style, mood, color, and composition of the reference image. The reference image guides the overall style transfer."
    elif image_exist_status == "source image exists":
        prompt = base_prompt + "edit the source image according to the text instructions. Clearly describe the intended result."
    else: # "image does not exist"
        prompt = base_prompt + "create a new image directly from the text instructions. This should be a descriptive generation prompt, not an editing prompt."

    negative_prompt = " Avoid distorted fingers, broken text, or unwanted artifacts."

    return prompt + negative_prompt

def call_openrouter_api(prompt, ref_image_data=None, src_image_data=None):
    """OpenRouter API를 호출하여 이미지를 생성/편집합니다."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    messages = [{"role": "user", "content": []}]
    messages[0]["content"].append({"type": "text", "text": prompt})

    if ref_image_data:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": ref_image_data}
        })
    if src_image_data:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": src_image_data}
        })

    body = {
        "model": GEMINI_MODEL,
        "messages": messages,
        "max_tokens": 2048 # 이미지 생성 모델에 따라 조절
    }

    response = requests.post(OPENROUTER_API_URL, headers=headers, json=body)
    response.raise_for_status()
    return response.json()

def upload_to_google_drive(image_b64, filename):
    """생성된 이미지를 Google Drive에 업로드합니다."""
    try:
        service = get_drive_service()
        image_data = base64.b64decode(image_b64)

        file_metadata = {
            'name': filename,
            'parents': [GOOGLE_DRIVE_FOLDER_ID]
        }

        media = MediaIoBaseUpload(io.BytesIO(image_data), mimetype='image/png', resumable=True)

        file = service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
        return file.get('webViewLink')
    except Exception as e:
        app.logger.error(f"Google Drive 업로드 오류: {e}")
        return None

# --- Flask API 엔드포인트 ---

@app.route('/generate-image', methods=['POST'])
def generate_image_endpoint():
    """프론트엔드로부터 요청을 받아 이미지 생성/편집을 수행하는 메인 핸들러."""
    try:
        # 1. 폼 데이터 및 파일 추출
        request_text = request.form.get('request_text')
        ref_image_file = request.files.get('ref_image')
        src_image_file = request.files.get('src_image')

        if not request_text:
            return jsonify({"error": "요청사항은 필수입니다."}), 400

        ref_b64_data = None
        src_b64_data = None
        image_exist_status = "image does not exist"

        # 2. 이미지 데이터 처리 및 상태 결정
        if ref_image_file:
            mimetype = ref_image_file.mimetype
            encoded_string = base64.b64encode(ref_image_file.read()).decode('utf-8')
            ref_b64_data = f"data:{mimetype};base64,{encoded_string}"
            image_exist_status = "reference image exists"

        if src_image_file:
            mimetype = src_image_file.mimetype
            encoded_string = base64.b64encode(src_image_file.read()).decode('utf-8')
            src_b64_data = f"data:{mimetype};base64,{encoded_string}"
            if image_exist_status != "reference image exists":
                 image_exist_status = "source image exists"

        # 3. AI 프롬프트 생성
        prompt = generate_ai_prompt(request_text, image_exist_status)

        # 4. OpenRouter API 호출
        api_response = call_openrouter_api(prompt, ref_b64_data, src_b64_data)

        # 5. 결과 이미지 추출 (API 응답 구조는 OpenRouter 문서를 참고하여 확인 필요)
        # 원본 n8n 요구사항: `choices[0].message.images[0].image_url.url`
        # Gemini Pro Vision 모델은 텍스트와 함께 이미지를 반환할 수 있습니다.
        # 아래는 일반적인 Vision 모델의 응답을 가정한 예시입니다.
        result_image_url = api_response["choices"][0]["message"]["content"]
        if "base64," in result_image_url:
             result_image_b64 = result_image_url.split("base64,")[1]
        else:
             # 만약 URL이라면 해당 URL에서 이미지를 다운로드 후 인코딩
             result_image_b64 = base64.b64encode(requests.get(result_image_url).content).decode('utf-8')

        # 6. Google Drive에 업로드
        timestamp = int(time.time())
        filename = f"edited_image_{timestamp}.png"
        drive_link = upload_to_google_drive(result_image_b64, filename)

        if not drive_link:
            return jsonify({"error": "Google Drive 업로드에 실패했습니다."}), 500

        # 7. 프론트엔드에 결과 반환
        return jsonify({
            "message": "이미지 생성 완료!",
            "drive_link": drive_link,
            "image_b64": result_image_b64 # 프론트에서 바로 표시할 수 있도록
        })

    except requests.exceptions.RequestException as e:
        app.logger.error(f"API 호출 오류: {e}")
        return jsonify({"error": f"API 호출 오류: {e}"}), 500
    except Exception as e:
        app.logger.error(f"서버 내부 오류: {e}")
        return jsonify({"error": f"서버 내부 오류: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
```

## 4. 추가 고려사항 및 모범 사례 (Further Considerations & Best Practices)

### 4.1. 프론트엔드 개발 (Frontend Development)
- **프레임워크 선택:** 웹 기반 앱을 원한다면 React, Vue, Svelte 같은 모던 JavaScript 프레임워크를 사용하거나, 간단한 앱이라면 순수 HTML/CSS/JavaScript로도 충분합니다. 데스크톱 앱을 원한다면 Python의 PyQt, Tkinter나 JavaScript 기반의 Electron 등을 사용할 수 있습니다.
- **API 통신:** 프론트엔드에서는 `fetch`나 `axios` 같은 라이브러리를 사용하여 백엔드의 `/generate-image` 엔드포인트로 `multipart/form-data` 요청을 보내야 합니다.

### 4.2. 오류 처리 및 사용자 피드백 (Error Handling & User Feedback)
- `app.py`의 `try...except` 블록을 더 세분화하여 네트워크 오류, API 키 오류, 파일 형식 오류 등 다양한 예외 상황에 대해 구체적인 에러 메시지를 프론트엔드로 반환해야 합니다.
- 프론트엔드는 이 에러 메시지를 사용자에게 명확하게 보여주어야 합니다 (예: "OpenRouter API 키가 유효하지 않습니다.").

### 4.3. 보안 (Security)
- **API 키 관리:** `.env` 파일과 `credentials.json` 파일은 절대로 Git과 같은 버전 관리 시스템에 포함해서는 안 됩니다. `.gitignore` 파일에 해당 파일들을 추가하여 유출을 방지하세요.
- **입력값 검증 (Input Validation):** 백엔드에서 파일 크기, 파일 형식 등을 검증하여 예상치 못한 입력으로 인해 서버가 오작동하는 것을 방지해야 합니다.

### 4.4. 확장성 (Scalability)
- **비동기 처리:** AI 이미지 생성은 시간이 오래 걸릴 수 있는 작업입니다. 사용자가 많은 경우를 대비하여 Celery나 RabbitMQ 같은 메시지 큐를 도입하여 이미지 생성 요청을 비동기적으로 처리하는 것을 고려할 수 있습니다.
- **모델 교체:** `GEMINI_MODEL` 상수를 쉽게 변경할 수 있도록 설계했으므로, 향후 더 좋거나 비용 효율적인 모델이 나오면 해당 부분만 수정하여 유연하게 대처할 수 있습니다.

이 가이드가 성공적인 '나노바나나 이미지 편집' GUI 앱 개발에 도움이 되기를 바랍니다.
