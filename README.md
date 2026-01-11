# 🚢 數據航海王 - 企業戰情室

> **團隊：我要成為海賊王**

一個基於 AI 的企業決策分析系統，整合 Google Gemini API，模擬高階會議流程，協助企業進行財務與營運數據分析。

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat&logo=vue.js)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?style=flat&logo=google)

---

## 📋 目錄

- [功能特色](#功能特色)
- [技術架構](#技術架構)
- [專案結構](#專案結構)
- [快速開始](#快速開始)
- [使用說明](#使用說明)
- [功能詳解](#功能詳解)
- [API 設定](#api-設定)
- [開發說明](#開發說明)

---

## ✨ 功能特色

### 1. **雙模式操作**
- **AI 助理（聊天模式）**：即時問答，協助理解數據
- **Multi Stage 分析（戰情室模式）**：模擬高階會議決策流程

### 2. **模擬高階會議流程**
分析模式依序產生三階段報告：
- **CFO 財務分析**：審視財務數據，以 Markdown 表格呈現關鍵指標
- **COO 營運分析**：評估執行可行性與營運面向
- **CEO 決策報告**：綜合前兩者報告，提供戰略決策與風險評估

### 3. **AI 自動視覺化**
- AI 自動判斷最適合的圖表類型（長條圖、折線圖等）
- 使用 Chart.js 即時生成互動式圖表
- 提供圖表說明與數據洞察

### 4. **風險評估系統**
- 0-100 風險指數評估
- 視覺化風險等級顯示：
  - 🟢 **低風險** (< 40)：綠色
  - 🟡 **中風險** (40-75)：黃色
  - 🔴 **高風險** (≥ 75)：紅色

### 5. **智能追問機制**
- 分析完成後自動生成 3 個建議追問問題
- 支援連續追問，保留歷史分析脈絡
- 上下文記憶功能，讓 AI 理解對話歷史

### 6. **歷史記錄管理**
- 自動保存所有分析歷史
- 完整保留圖表視覺化與報告內容
- 支援多輪分析，畫面疊加顯示不覆蓋

---

## 🛠 技術架構

### 前端框架
- **Vue.js 3** (Composition API)
- **Bootstrap 5.3.0** - UI 框架
- **Chart.js** - 數據視覺化圖表
- **Marked.js** - Markdown 渲染
- **Font Awesome 6.0** - 圖標庫

### AI 整合
- **Google Gemini API**
- 支援模型：
  - `gemini-3-pro-preview` (預設)
  - `gemini-1.5-pro`

### 數據處理
- CSV 檔案上傳與解析
- JSON 數據提取與解析
- Markdown 格式支援

---

## 📁 專案結構

```
網頁前端期末/
├── index.html          # 主頁面結構
├── app.js              # Vue 應用邏輯（425 行）
├── style.css           # 自訂樣式
├── demo.csv            # 範例數據檔案（可選）
└── README.md           # 專案說明文檔
```

---

## 🚀 快速開始

### 前置需求

- 現代瀏覽器（Chrome、Firefox、Edge、Safari）
- Google Gemini API Key（[取得方式](#api-設定)）
- 本地 Web 伺服器（可選，可直接開啟 HTML）

### 安裝步驟

1. **下載專案**
   ```bash
   # 直接下載或 Clone 專案
   ```

2. **開啟專案**
   
   **方法一：直接開啟（簡單）**
   - 雙擊 `index.html` 在瀏覽器中開啟
   
   **方法二：使用本地伺服器（推薦）**
   ```bash
   # 使用 Python（Python 3）
   python -m http.server 8000
   
   # 或使用 Node.js (需安裝 http-server)
   npx http-server
   
   # 然後在瀏覽器開啟
   http://localhost:8000
   ```

3. **設定 API Key**
   - 在左側控制中心輸入您的 Google Gemini API Key
   - 選擇 AI 模型引擎（預設：gemini-3-pro-preview）

4. **上傳數據**
   - 點擊上傳區域，選擇 CSV 格式的數據檔案
   - 系統會自動讀取並解析前 15,000 字元

---

## 📖 使用說明

### 基本流程

1. **準備數據**
   - 準備 CSV 格式的數據檔案（例如：財務報表、營運數據等）
   - CSV 格式建議：
     ```csv
     location,date,total_cases,total_deaths
     Japan,2019-12-31,0.0,0.0
     Japan,2020-01-07,0.0,0.0
     ```

2. **上傳檔案**
   - 在左側控制中心點擊上傳區域
   - 選擇 CSV 檔案，系統會顯示檔案名稱確認

3. **選擇模式**

   **模式一：AI 助理**
   - 切換到「AI 助理」分頁
   - 輸入問題，即時獲得 AI 回答
   - 適用於快速查詢數據相關問題

   **模式二：Multi Stage 分析**
   - 切換到「Multi Stage」分頁
   - 輸入分析問題（例如：「分析 2024 年 Q3 的利潤下滑原因」）
   - 點擊「啟動分析」按鈕

4. **查看分析結果**
   - 系統會依序顯示 CFO、COO、CEO 的報告
   - 查看自動生成的圖表視覺化
   - 查看風險評估指數

5. **深入追問**
   - 使用 AI 建議的追問問題繼續分析
   - 或輸入自訂問題進行連續分析
   - 歷史記錄會自動保存並疊加顯示

### 功能按鈕

- **重置系統**：清除所有數據和歷史記錄，重新載入頁面

---

## 🔍 功能詳解

### Multi Stage 分析流程

#### 階段 1：CFO 財務分析
- **進度**：33%
- **任務**：審計財務數據，識別關鍵財務指標
- **輸出**：Markdown 格式的財務報告，包含表格數據

#### 階段 2：COO 營運分析
- **進度**：66%
- **任務**：評估營運可行性，參考 CFO 報告
- **輸出**：營運面分析報告，執行層面建議

#### 階段 3：CEO 決策報告
- **進度**：100%
- **任務**：綜合 CFO 和 COO 報告，制定戰略決策
- **輸出**：
  - 戰略決策報告
  - 風險評估分數（0-100）
  - 圖表數據（JSON 格式）

### 圖表自動生成

系統會從 CEO 報告中提取圖表 JSON 數據，自動渲染：
- 圖表類型：由 AI 判斷（bar、line 等）
- 數據標籤：自動設定
- 圖表標題：AI 生成
- 圖表說明：提供數據洞察

### 上下文記憶

當進行追問時，系統會：
1. 將當前分析存入歷史記錄
2. 將歷史會議脈絡加入 Prompt
3. 讓 AI 基於之前討論的內容回答新問題

---

## 🔑 API 設定

### 取得 Google Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入 Google 帳號
3. 點擊「Create API Key」
4. 複製 API Key
5. 在應用程式的左側控制中心貼上

### API 限制

- 檔案大小限制：15,000 字元（CSV 內容）
- API 配額：依 Google 帳號而定
- 建議：在正式使用前測試 API Key 是否有效

### 支援的模型

- `gemini-3-pro-preview`（預設）
- `gemini-1.5-pro`

---

## 💻 開發說明

### 核心檔案說明

#### `index.html`
- 頁面結構與模板
- Vue.js 應用掛載點
- Bootstrap 樣式引入

#### `app.js`
主要功能模組：
- **`callGeminiAPI()`**：呼叫 Google Gemini API
- **`startExecutiveAnalysis()`**：執行三階段分析流程
- **`renderAIChart()`**：渲染圖表視覺化
- **`archiveCurrentMeeting()`**：歸檔歷史記錄
- **`handleFollowUp()`**：處理追問邏輯
- **`extractAndRemoveJSON()`**：從 AI 回應中提取 JSON

#### `style.css`
- 自訂樣式定義
- 動畫效果（fade-in、bounce）
- 響應式設計調整

### 資料結構

```javascript
{
  apiKey: '',              // Google API Key
  selectedModel: '',       // AI 模型選擇
  csvContent: '',          // CSV 數據內容
  currentTab: 'chat',      // 當前分頁
  reports: {               // 當前分析報告
    cfo: null,
    coo: null,
    ceo: null
  },
  meetingLogs: [],        // 歷史分析記錄
  contextMemory: '',       // 上下文記憶
  riskScore: 50,          // 風險分數
  followUpQuestions: []    // 追問問題列表
}
```

### 自訂開發

#### 修改 AI Prompt
編輯 `app.js` 中的 `startExecutiveAnalysis()` 函數，修改各階段的 Prompt。

#### 調整圖表樣式
編輯 `app.js` 中的 `createChart()` 函數，修改 Chart.js 配置。

#### 自訂樣式
編輯 `style.css`，調整顏色、字體、動畫等。

---

## 🎨 UI/UX 特色

- **玻璃擬態設計**：現代化的導覽列設計
- **響應式布局**：支援桌面與行動裝置
- **平滑動畫**：淡入、滑動等過渡效果
- **進度指示**：清楚顯示分析進度
- **視覺化圖表**：互動式數據圖表
- **中文介面**：完整繁體中文支援

---

## 📝 注意事項

1. **API Key 安全**：請勿將 API Key 提交到公開儲存庫
2. **數據隱私**：上傳的數據會傳送至 Google Gemini API，請注意資料隱私
3. **瀏覽器相容性**：建議使用最新版本的現代瀏覽器
4. **網路連線**：需要穩定的網路連線以呼叫 API

---

## 🐛 已知問題

- CSV 檔案大小限制為 15,000 字元
- 圖表渲染依賴 Chart.js 和正確的 JSON 格式
- 某些特殊 Markdown 語法可能需要手動調整

---

## 📄 授權

此專案為期末專案作品，僅供學習使用。

---

## 👥 團隊資訊

**團隊名稱**：我要成為海賊王  
**專案名稱**：數據航海王 - 企業戰情室  
**版本**：1.0.0

---

## 🙏 致謝

- [Vue.js](https://vuejs.org/)
- [Bootstrap](https://getbootstrap.com/)
- [Chart.js](https://www.chartjs.org/)
- [Google Gemini API](https://ai.google.dev/)
- [Font Awesome](https://fontawesome.com/)

---

## 📧 聯絡資訊

如有問題或建議，歡迎提出 Issue 或 Pull Request。

---

**Made with ❤️ by 我要成為海賊王**

