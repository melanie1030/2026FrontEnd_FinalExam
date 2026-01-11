const { createApp } = Vue;

createApp({
    data() {
        return {
            apiKey: '', 
            // 鎖定模型
            selectedModel: 'gemini-3-pro-preview',
            fileName: '',
            csvContent: '', 
            currentTab: 'chat', 
            
            userInput: '',      
            executiveInput: '', 
            
            loading: false,
            isAnalyzing: false, 
            
            currentStep: 0, 
            riskScore: 50,
            hasChartData: false,
            chartInstance: null,
            chartExplanation: '',
            
            // 暫存當前圖表的 JSON 字串，以便存入歷史紀錄
            currentChartJsonStr: null, 
            
            chatHistory: [
                { role: 'ai', content: '您好！我是企業決策 AI。' }
            ],

            // 這裡存放「正在進行中」的分析
            reports: { cfo: null, coo: null, ceo: null },
            followUpQuestions: [],

            // 這裡存放「過去已完成」的分析 (History)
            meetingLogs: [],
            
            // 讓 AI 記得上下文
            contextMemory: '' 
        }
    },
    computed: {
        progressWidth() {
            if (this.currentStep === 1) return 33;
            if (this.currentStep === 2) return 66;
            if (this.currentStep === 3) return 100;
            return 0;
        },
        progressText() {
            if (this.currentStep === 1) return this.contextMemory ? "CFO 正在回顧歷史並審視新議題..." : "CFO 正在審計財務數據...";
            if (this.currentStep === 2) return "COO 正在評估執行可行性...";
            if (this.currentStep === 3) return "CEO 正在制定戰略決策...";
            return "等待指令";
        },
        riskColorClass() {
            if (this.riskScore < 40) return 'bg-success';
            if (this.riskScore < 75) return 'bg-warning';
            return 'bg-danger';
        }
    },
    methods: {
        renderMarkdown(text) {
            if (!text) return '';
            // 簡單的 markdown 處理，避免 marked 未加載時報錯
            if (typeof marked !== 'undefined') {
                let html = marked.parse(text);
                return html.replace(/<table>/g, '<table class="table table-bordered table-striped table-hover mt-2">');
            }
            return text;
        },

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.fileName = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.csvContent = e.target.result.substring(0, 15000); 
                    alert(`檔案 ${this.fileName} 讀取成功！`);
                };
                reader.readAsText(file);
            }
        },

        async callGeminiAPI(systemPrompt, userQuery) {
            if (!this.apiKey) {
                alert("請先輸入 API Key！");
                throw new Error("No API Key");
            }
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`;
            
            const payload = {
                contents: [{
                    parts: [{
                        text: `[系統角色]: ${systemPrompt}\n\n[數據摘要]: ${this.csvContent}\n\n[使用者問題]: ${userQuery}`
                    }]
                }]
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.error) throw new Error(data.error.message);
                
                if (data.candidates && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                }
                return "無回應";
            } catch (error) {
                console.error("API Error:", error);
                return `Error: ${error.message}`;
            }
        },

        // --- Chat 功能 ---
        async sendMessage() {
            if (!this.userInput.trim()) return;
            this.chatHistory.push({ role: 'user', content: this.userInput });
            const userQ = this.userInput;
            this.userInput = '';
            this.loading = true;
            this.$nextTick(() => { const chatBox = document.getElementById('chatBox'); if(chatBox) chatBox.scrollTop = chatBox.scrollHeight; });

            try {
                const aiResponse = await this.callGeminiAPI("你是數據助手，請簡潔回答。", userQ);
                this.chatHistory.push({ role: 'ai', content: aiResponse, model: this.selectedModel });
                this.$nextTick(() => { const chatBox = document.getElementById('chatBox'); if(chatBox) chatBox.scrollTop = chatBox.scrollHeight; });
            } catch (e) {
                this.chatHistory.push({ role: 'ai', content: "連線錯誤或 API Key 無效。" });
            } finally {
                this.loading = false;
            }
        },
        
        // --- [關鍵] 歸檔舊會議紀錄 ---
        // 這是實現「不要清空畫面，而是接著顯示」的技術核心
        archiveCurrentMeeting(lastQuery) {
            // 如果當前有 CEO 報告，代表有東西可以存
            if (this.reports.ceo) {
                const log = {
                    query: lastQuery, 
                    reports: { ...this.reports }, // 複製一份報告
                    riskScore: this.riskScore,
                    chartJson: this.currentChartJsonStr // 保存當時的圖表資料
                };
                
                // 推入歷史陣列
                this.meetingLogs.push(log);
                
                // 歸檔後，必須在下一個 DOM 更新循環渲染歷史圖表
                const historyIndex = this.meetingLogs.length - 1;
                this.$nextTick(() => {
                    this.renderHistoryChart(historyIndex, log.chartJson);
                });
            }
        },

        // --- 核心邏輯：追問 ---
        handleFollowUp(question) {
            // 1. 先把現在畫面上的內容「搬」到歷史區 (meetingLogs)
            this.archiveCurrentMeeting(this.executiveInput);

            // 2. 更新記憶脈絡 (Context)，讓 AI 知道剛才聊了什麼
            this.contextMemory += `
                [歷史紀錄]
                問題: ${this.executiveInput}
                CEO結論: ${this.reports.ceo ? this.reports.ceo.substring(0, 300).replace(/\n/g, ' ') : "無"}...
            `;

            // 3. 設定新的問題到輸入框
            this.executiveInput = question;

            // 4. 啟動新一輪分析 (參數 true 代表是追問)
            this.startExecutiveAnalysis(true);
            
            // 5. 自動滾動到底部
            setTimeout(() => {
                 window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 500);
        },

        resetSystem() {
            if(confirm('重置系統？')) location.reload();
        },

        // --- 圖表渲染 (當前正在跑的) ---
        renderAIChart(chartJsonStr) {
            this.currentChartJsonStr = chartJsonStr; // 暫存起來給歷史紀錄用
            const ctx = document.getElementById('dynamicChart');
            if (!ctx) return;
            if (this.chartInstance) this.chartInstance.destroy();

            try {
                const chartData = JSON.parse(chartJsonStr);
                this.chartExplanation = chartData.explanation || "AI 自動生成圖表";
                this.hasChartData = true;
                this.chartInstance = this.createChart(ctx, chartData, false);
            } catch (e) {
                console.error("圖表渲染失敗:", e);
                this.hasChartData = false;
            }
        },

        // --- 圖表渲染 (歷史紀錄的) ---
        renderHistoryChart(index, chartJsonStr) {
            if (!chartJsonStr) return;
            const canvasId = 'history-chart-' + index; // 動態 ID
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;
            
            try {
                const chartData = JSON.parse(chartJsonStr);
                // 歷史圖表畫完就好，不需要 interactive instance
                this.createChart(ctx, chartData, true);
            } catch (e) {
                console.error("歷史圖表渲染失敗:", e);
            }
        },

        // 共用的建圖函數
        createChart(ctx, chartData, isHistory) {
            return new Chart(ctx, {
                type: chartData.type || 'bar', 
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: chartData.datasetLabel || '數值',
                        data: chartData.data,
                        // 歷史圖表用灰色，當前圖表用彩色
                        backgroundColor: chartData.type === 'line' ? 'rgba(13, 110, 253, 0.1)' : (isHistory ? ['rgba(108, 117, 125, 0.6)'] : [
                            'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 
                            'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'
                        ]),
                        borderColor: isHistory ? 'rgba(108, 117, 125, 1)' : 'rgba(13, 110, 253, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: chartData.type === 'line'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true },
                        title: { display: true, text: chartData.title || '分析圖表' }
                    }
                }
            });
        },

        // --- [修復版] JSON 提取工具 ---
        // 使用更安全的字串處理，避免正則表達式語法錯誤
        extractAndRemoveJSON(text, key) {
            let extractedData = null;
            let cleanedText = text;

            try {
                // 尋找 ```json 區塊
                const startMarker = "```json";
                const endMarker = "```";
                
                const startIndex = text.indexOf(startMarker);
                if (startIndex !== -1) {
                    const endIndex = text.indexOf(endMarker, startIndex + startMarker.length);
                    if (endIndex !== -1) {
                        const jsonString = text.substring(startIndex + startMarker.length, endIndex);
                        // 嘗試解析
                        const parsed = JSON.parse(jsonString);
                        // 如果這個 JSON 物件包含我們要的 key (例如 "risk_score" 或 "chart")
                        if (parsed[key]) {
                            extractedData = parsed;
                            // 從原文中移除這段代碼
                            cleanedText = text.substring(0, startIndex) + text.substring(endIndex + endMarker.length);
                        }
                    }
                } else {
                    // 如果沒有 markdown 標記，嘗試直接找 { "key": ... } (備用方案)
                    const regex = new RegExp(`(\\{\\s*"${key}"[\\s\\S]*?\\})`);
                    const match = text.match(regex);
                    if (match) {
                        const parsed = JSON.parse(match[1]);
                        extractedData = parsed;
                        cleanedText = text.replace(match[1], '');
                    }
                }
            } catch (e) {
                console.error("JSON 解析錯誤 (可忽略):", e);
            }
            
            return { data: extractedData, text: cleanedText };
        },

        async generateFollowUps() {
            const fullReport = `CFO:${this.reports.cfo}\nCEO:${this.reports.ceo}`;
            const prompt = `
                你是戰略顧問。請根據會議報告，預測使用者會想追問的 3 個深入問題。
                輸出規則：只回傳 JSON 字串陣列 (Array)，請務必包在 \`\`\`json ... \`\`\` 區塊中。
            `;
            try {
                let result = await this.callGeminiAPI(prompt, `完整報告內容：\n${fullReport}`);
                // 簡單抓取 json 區塊
                const startIndex = result.indexOf("```json");
                const endIndex = result.lastIndexOf("```");
                if (startIndex !== -1 && endIndex > startIndex) {
                     const jsonStr = result.substring(startIndex + 7, endIndex);
                     this.followUpQuestions = JSON.parse(jsonStr);
                } else {
                    // 容錯
                    this.followUpQuestions = JSON.parse(result.replace(/```/g, '').replace(/json/g, '')); 
                }
            } catch (e) {
                this.followUpQuestions = ["請詳細解釋數據來源", "具體的執行步驟是什麼？", "潛在的風險有哪些？"];
            }
        },

        async startExecutiveAnalysis(isFollowUp = false) {
            if (!this.csvContent || !this.executiveInput.trim() || !this.apiKey) {
                alert("請檢查 API Key 與檔案是否備妥。");
                return;
            }

            // 如果是「手動」按下分析按鈕（不是點追問），且當前已經有報告，我們也把它存起來
            if (!isFollowUp && this.reports.ceo) {
                this.archiveCurrentMeeting(this.executiveInput); 
                this.contextMemory = ''; // 手動開始視為新話題，清空記憶
            }

            // 初始化新一輪分析狀態
            this.isAnalyzing = true;
            this.reports = { cfo: null, coo: null, ceo: null }; 
            this.followUpQuestions = []; 
            this.hasChartData = false; 
            
            const userQuery = this.executiveInput;
            
            // 組合 Prompt
            const contextPrompt = this.contextMemory 
                ? `\n\n=== 歷史會議脈絡 ===\n${this.contextMemory}\n\n注意：這是一場連續會議，請基於脈絡回答新問題。\n====================\n` 
                : "";

            try {
                // 1. CFO
                this.currentStep = 1;
                const cfoResult = await this.callGeminiAPI(
                    `你是 CFO。${contextPrompt} 請根據數據回答問題，使用 Markdown 表格呈現關鍵指標。`, 
                    userQuery
                );
                this.reports.cfo = cfoResult;

                // 2. COO
                this.currentStep = 2;
                const cooResult = await this.callGeminiAPI(
                    `你是 COO。${contextPrompt} 參考 CFO 最新報告：\n${cfoResult}\n請針對營運面分析。`, 
                    userQuery
                );
                this.reports.coo = cooResult;

                // 3. CEO
                this.currentStep = 3;
                const ceoPrompt = `
                    你是 CEO。綜合 CFO 和 COO 的報告。${contextPrompt}
                    請針對問題給出決策。
                    
                    【非常重要 - 輸出規則】：
                    1. 你的文字報告結束後，必須輸出兩個 JSON 物件。
                    2. **請務必將 JSON 放在 Markdown 代碼區塊中 (\`\`\`json ... \`\`\`)**。
                    
                    格式範例：
                    \`\`\`json
                    { "risk_score": 85 }
                    \`\`\`

                    \`\`\`json
                    { "chart": { "type": "bar", "title": "...", "labels": [...], "data": [...], "datasetLabel": "...", "explanation": "..." } }
                    \`\`\`
                `;
                
                let ceoRawResult = await this.callGeminiAPI(ceoPrompt, userQuery);

                // --- 解析 JSON 並從報告中移除 ---
                
                // 1. 風險分數
                const riskResult = this.extractAndRemoveJSON(ceoRawResult, "risk_score");
                if (riskResult.data) {
                    this.riskScore = parseInt(riskResult.data.risk_score);
                    ceoRawResult = riskResult.text; 
                }

                // 2. 圖表數據
                const chartResult = this.extractAndRemoveJSON(ceoRawResult, "chart");
                if (chartResult.data) {
                    const chartData = chartResult.data.chart; 
                    this.$nextTick(() => { 
                        // 畫圖
                        this.renderAIChart(JSON.stringify(chartData)); 
                    });
                    ceoRawResult = chartResult.text; 
                }

                this.reports.ceo = ceoRawResult.trim();

                await this.generateFollowUps();

            } catch (e) {
                alert("分析錯誤: " + e.message);
                console.error(e);
            } finally {
                this.isAnalyzing = false;
                setTimeout(() => { this.currentStep = 0; }, 2000);
            }
        }
    }
}).mount('#app');