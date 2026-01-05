const { createApp } = Vue;

createApp({
    data() {
        return {
            apiKey: '', 
            // [修正] 預設模型為 3.0 Pro
            selectedModel: 'gemini-3-pro-preview',
            fileName: '',
            csvContent: '', 
            currentTab: 'chat', 
            userInput: '',
            executiveInput: '', 
            loading: false,
            isAnalyzing: false, 
            
            // 進度與圖表狀態
            currentStep: 0, 
            riskScore: 50,
            hasChartData: false,
            chartInstance: null,
            chartExplanation: '',
            
            chatHistory: [
                { role: 'ai', content: '您好！我是企業決策 AI。我可以自動根據對話內容，為您生成最適合的數據圖表。' }
            ],

            reports: { cfo: null, coo: null, ceo: null }
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
            if (this.currentStep === 1) return "CFO 正在審計財務數據...";
            if (this.currentStep === 2) return "COO 正在檢視供應鏈效率...";
            if (this.currentStep === 3) return "CEO 正在構建可視化戰略...";
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
            let html = marked.parse(text);
            return html.replace(/<table>/g, '<table class="table table-bordered table-striped table-hover mt-2">');
        },

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.fileName = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    // 為了避免 Token 過長，截取前 15000 字元
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
            // 使用選中的模型 ID
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`;
            
            const payload = {
                contents: [{
                    parts: [{
                        text: `[角色]: ${systemPrompt}\n[數據摘要]: ${this.csvContent}\n[使用者問題]: ${userQuery}`
                    }]
                }]
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                
                if (data.error) throw new Error(data.error.message);
                
                if (data.candidates && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                }
                return "無回應";
            } catch (error) {
                console.error("API Error:", error);
                return `Error (${this.selectedModel}): ${error.message}`;
            }
        },

        async sendMessage() {
            if (!this.userInput.trim()) return;
            this.chatHistory.push({ role: 'user', content: this.userInput });
            const userQ = this.userInput;
            this.userInput = '';
            this.loading = true;

            try {
                const aiResponse = await this.callGeminiAPI("你是數據助手，請簡潔回答，需要時使用表格。", userQ);
                this.chatHistory.push({ role: 'ai', content: aiResponse, model: this.selectedModel });
            } catch (e) {
                this.chatHistory.push({ role: 'ai', content: "連線錯誤或 API Key 無效。" });
            } finally {
                this.loading = false;
            }
        },

        resetSystem() {
            if(confirm('重置系統？')) location.reload();
        },

        // --- 繪製 AI 提供的 JSON 圖表 ---
        renderAIChart(chartJsonStr) {
            const ctx = document.getElementById('dynamicChart');
            if (!ctx) return;
            if (this.chartInstance) this.chartInstance.destroy();

            try {
                const chartData = JSON.parse(chartJsonStr);
                this.chartExplanation = chartData.explanation || "AI 自動生成圖表";
                this.hasChartData = true;

                this.chartInstance = new Chart(ctx, {
                    type: chartData.type || 'bar', 
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: chartData.datasetLabel || '數值',
                            data: chartData.data,
                            backgroundColor: chartData.type === 'line' ? 'rgba(13, 110, 253, 0.1)' : [
                                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 
                                'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                                'rgba(153, 102, 255, 0.6)'
                            ],
                            borderColor: 'rgba(13, 110, 253, 1)',
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
            } catch (e) {
                console.error("圖表渲染失敗:", e);
                this.hasChartData = false;
            }
        },

        // --- 高管分析流程 ---
        async startExecutiveAnalysis() {
            if (!this.csvContent || !this.executiveInput.trim() || !this.apiKey) {
                alert("請檢查 API Key 與檔案是否備妥。");
                return;
            }

            this.isAnalyzing = true;
            this.reports = { cfo: null, coo: null, ceo: null };
            this.hasChartData = false; // 先隱藏圖表
            const userQuery = this.executiveInput;

            try {
                // 1. CFO
                this.currentStep = 1;
                const cfoResult = await this.callGeminiAPI("你是 CFO。請根據數據回答問題，務必使用 Markdown 表格來呈現關鍵財務指標。", userQuery);
                this.reports.cfo = cfoResult;

                // 2. COO
                this.currentStep = 2;
                const cooResult = await this.callGeminiAPI(`你是 COO。參考 CFO 的報告：\n${cfoResult}\n請針對營運面進行分析。`, userQuery);
                this.reports.coo = cooResult;

                // 3. CEO (關鍵：要求 JSON 格式)
                this.currentStep = 3;
                const ceoPrompt = `
                    你是 CEO。綜合 CFO 和 COO 的報告，針對問題給出戰略決策。
                    
                    【非常重要 - 輸出規則】：
                    1. 你的文字報告結束後，必須在最後面加上以下兩個 JSON 物件。
                    2. 請直接輸出純 JSON 文字，**不要**使用 Markdown 代碼區塊 (不要用 \`\`\`json )。
                    3. 格式如下：

                    { "risk_score": 0到100的整數 }

                    { "chart": { "type": "bar 或 line", "title": "圖表標題", "labels": ["標籤1", "標籤2"], "data": [10, 20], "datasetLabel": "數據名稱", "explanation": "圖表解釋" } }
                `;
                
                let ceoRawResult = await this.callGeminiAPI(ceoPrompt, userQuery);

                // --- 強壯的解析邏輯 ---
                
                // 1. 抓取並移除 risk_score
                const riskRegex = /\{\s*"risk_score"\s*:\s*(\d+)\s*\}/;
                const riskMatch = ceoRawResult.match(riskRegex);
                if (riskMatch) {
                    this.riskScore = parseInt(riskMatch[1]);
                    ceoRawResult = ceoRawResult.replace(riskMatch[0], '');
                }

                // 2. 抓取並移除 chart JSON (支援換行與巢狀)
                const chartRegex = /\{\s*"chart"\s*:\s*(\{[\s\S]*?\})\s*\}/;
                const chartMatch = ceoRawResult.match(chartRegex);
                if (chartMatch) {
                    const chartJsonStr = chartMatch[1]; // 取得內層 JSON
                    // 等待 DOM 更新後畫圖
                    this.$nextTick(() => {
                        this.renderAIChart(chartJsonStr);
                    });
                    ceoRawResult = ceoRawResult.replace(chartMatch[0], '');
                }

                // 3. 設定最終 CEO 報告文字
                this.reports.ceo = ceoRawResult.trim();

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