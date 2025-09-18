// 메인 애플리케이션 로직
class StatsApp {
  constructor() {
    this.data = [];
    this.fields = [];
    this.currentAnalysis = null;
    this.analysisHistory = [];
    this.analysisHandlers = this.createAnalysisHandlers();

    this.init();
  }

  // 애플리케이션 초기화
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.setupFileUpload();
    this.loadAnalysisHistory();
    this.updateUI();

    Components.Toast.success('통계 분석 서비스가 준비되었습니다!');
  }

  createAnalysisHandlers() {
    return {
      descriptive: {
        name: '기초통계량',
        computeStatistics: (xData, yData) => ({
          x: Statistics.Descriptive.calculate(xData),
          y: Statistics.Descriptive.calculate(yData)
        }),
        createChart: (xData, yData, independentVar, dependentVar) =>
          this.createHistogramChart(xData, yData, independentVar, dependentVar),
        buildTable: (result) => ({
          headers: ['변수', '평균', '중앙값', '표준편차', '최소값', '최대값'],
          rows: [
            [
              result.independentVar,
              result.statistics.x.mean.toFixed(3),
              result.statistics.x.median.toFixed(3),
              result.statistics.x.std.toFixed(3),
              result.statistics.x.min.toFixed(3),
              result.statistics.x.max.toFixed(3)
            ],
            [
              result.dependentVar,
              result.statistics.y.mean.toFixed(3),
              result.statistics.y.median.toFixed(3),
              result.statistics.y.std.toFixed(3),
              result.statistics.y.min.toFixed(3),
              result.statistics.y.max.toFixed(3)
            ]
          ]
        })
      },
      scatter: {
        name: '산점도',
        computeStatistics: (xData, yData) => Statistics.Correlation.pearson(xData, yData),
        createChart: (xData, yData, independentVar, dependentVar) =>
          this.createScatterChart(xData, yData, independentVar, dependentVar),
        buildTable: (result) => ({
          headers: ['분석 유형', '상관계수', 'p-값', '유의성', '강도'],
          rows: [[
            '피어슨 상관분석',
            result.statistics.correlation.toFixed(3),
            result.statistics.pValue.toFixed(4),
            this.formatSignificance(result.statistics.significant),
            result.statistics.strength
          ]]
        }),
        buildSummary: (result) => `
          <ul>
            <li><strong>상관계수:</strong> ${result.statistics.correlation.toFixed(3)}</li>
            <li><strong>p-값:</strong> ${result.statistics.pValue.toFixed(4)}</li>
            <li><strong>유의성:</strong> ${this.formatSignificance(result.statistics.significant, true)}</li>
            <li><strong>상관관계 강도:</strong> ${result.statistics.strength}</li>
          </ul>
        `
      },
      'regression-simple': {
        name: '단순선형회귀',
        computeStatistics: (xData, yData) => Statistics.Regression.simpleLinear(xData, yData),
        createChart: (xData, yData, independentVar, dependentVar, statistics) =>
          this.createRegressionChart(xData, yData, independentVar, dependentVar, statistics),
        buildTable: (result) => ({
          headers: ['계수', '값', '해석'],
          rows: [
            ['절편', result.statistics.intercept.toFixed(3), '기준값'],
            ['기울기', result.statistics.slope.toFixed(3), '변화율'],
            ['R²', result.statistics.r2.toFixed(3), '설명력'],
            ['p-값', result.statistics.pValue.toFixed(4), this.formatSignificance(result.statistics.significant)]
          ]
        }),
        buildSummary: (result) => `
          <ul>
            <li><strong>R²:</strong> ${result.statistics.r2.toFixed(3)}</li>
            <li><strong>회귀식:</strong> ${result.statistics.equation}</li>
            <li><strong>p-값:</strong> ${result.statistics.pValue.toFixed(4)}</li>
            <li><strong>유의성:</strong> ${this.formatSignificance(result.statistics.significant, true)}</li>
          </ul>
        `
      }
    };
  }

  // 설정 로드
  loadSettings() {
    ConfigUtils.loadFromStorage();
    
    // 테마 설정
    const savedTheme = Utils.Storage.get('theme', 'light');
    this.setTheme(savedTheme);
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 테마 토글
    Utils.DOM.addEvent('#themeToggle', 'click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    });

    // 샘플 데이터 버튼
    Utils.DOM.addEvent('#sampleDataBtn', 'click', () => {
      this.loadSampleData();
    });

    // 분석 실행 버튼
    Utils.DOM.addEvent('#runAnalysisBtn', 'click', () => {
      this.runAnalysis();
    });

    // 탭 전환
    Utils.DOM.addEvent('#resultTabs', 'click', (e) => {
      if (e.target.classList.contains('tab')) {
        this.switchTab(e.target.dataset.tab);
      }
    });
  }

  // 파일 업로드 설정
  setupFileUpload() {
    Components.FileUpload.create('#fileUploadContainer', {
      onUpload: (file) => {
        this.handleFileUpload(file);
      },
      onError: (error) => {
        Components.Toast.error(error);
      }
    });
  }

  // 파일 업로드 처리
  handleFileUpload(file) {
    const spinner = Components.Spinner.showFullscreen('파일을 처리하고 있습니다...');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        Components.Spinner.hide(spinner);
        
        if (results.errors.length > 0) {
          Components.Toast.error('파일 파싱 중 오류가 발생했습니다.');
          return;
        }
        
        this.data = results.data;
        this.fields = results.meta.fields;
        
        this.populateVariableSelectors();
        this.renderDataPreview();
        this.updateUI();
        
        Components.Toast.success(`${this.data.length}개의 데이터가 로드되었습니다.`);
      },
      error: (error) => {
        Components.Spinner.hide(spinner);
        Components.Toast.error('파일을 읽을 수 없습니다.');
      }
    });
  }

  // 샘플 데이터 로드
  loadSampleData() {
    const sampleData = [
      { height: 170, weight: 65, age: 25, gender: 'M', score: 85 },
      { height: 175, weight: 70, age: 30, gender: 'M', score: 92 },
      { height: 160, weight: 55, age: 28, gender: 'F', score: 78 },
      { height: 180, weight: 80, age: 35, gender: 'M', score: 88 },
      { height: 165, weight: 60, age: 27, gender: 'F', score: 82 }
    ];
    
    this.data = sampleData;
    this.fields = Object.keys(sampleData[0]);
    
    this.populateVariableSelectors();
    this.renderDataPreview();
    this.updateUI();
    
    Components.Toast.success('샘플 데이터가 로드되었습니다.');
  }

  // 변수 선택기 채우기
  populateVariableSelectors() {
    const options = this.fields.map(field => 
      `<option value="${field}">${field}</option>`
    ).join('');
    
    const indepSelect = Utils.DOM.$('#independentVariable');
    const depSelect = Utils.DOM.$('#dependentVariable');
    
    indepSelect.innerHTML = '<option value="" disabled selected>독립변수를 선택하세요</option>' + options;
    depSelect.innerHTML = '<option value="" disabled selected>종속변수를 선택하세요</option>' + options;
  }

  // 데이터 미리보기 렌더링
  renderDataPreview() {
    const container = Utils.DOM.$('#dataPreviewContainer');
    
    if (this.data.length === 0) {
      container.innerHTML = `
        <div class="text-center text-secondary">
          <p>데이터를 업로드하거나 샘플 데이터를 선택하세요.</p>
        </div>
      `;
      return;
    }
    
    const previewData = this.data.slice(0, 10);
    const table = Components.Table.create(previewData, {
      headers: this.fields,
      sortable: true,
      searchable: true,
      pagination: false
    });
    
    container.innerHTML = '';
    container.appendChild(table);
    
    const info = Utils.DOM.createElement('div', 'mt-3 text-secondary');
    info.innerHTML = `
      <p><strong>총 ${this.data.length}개</strong>의 데이터, <strong>${this.fields.length}개</strong>의 변수</p>
      <p>위 표는 처음 10개 행을 보여줍니다.</p>
    `;
    container.appendChild(info);
  }

  // 분석 실행
  runAnalysis() {
    const method = Utils.DOM.$('#analysisMethod').value;
    const independentVar = Utils.DOM.$('#independentVariable').value;
    const dependentVar = Utils.DOM.$('#dependentVariable').value;
    
    if (!method || !independentVar || !dependentVar) {
      Components.Toast.error('분석 방법과 변수를 모두 선택해주세요.');
      return;
    }
    
    if (this.data.length === 0) {
      Components.Toast.error('분석할 데이터가 없습니다.');
      return;
    }
    
    const spinner = Components.Spinner.showFullscreen('분석을 실행하고 있습니다...');

    try {
      const result = this.performAnalysis(method, independentVar, dependentVar);
      this.currentAnalysis = result;

      this.renderResults(result);
      this.addToHistory(result);
      this.showAnalysisResults();

      Components.Toast.success('분석이 완료되었습니다!');
    } catch (error) {
      Components.Toast.error(`분석 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      Components.Spinner.hide(spinner);
    }
  }

  // 분석 수행
  performAnalysis(method, independentVar, dependentVar) {
    const handler = this.getAnalysisHandler(method, { strict: true });
    const xData = this.getNumericData(independentVar);
    const yData = this.getNumericData(dependentVar);

    this.validateNumericData(xData, yData);

    const timestamp = new Date().toISOString();
    const analysisId = `analysis_${timestamp}`;

    const statistics = handler.computeStatistics
      ? handler.computeStatistics(xData, yData, independentVar, dependentVar)
      : null;

    const chart = handler.createChart
      ? handler.createChart(xData, yData, independentVar, dependentVar, statistics)
      : null;

    return {
      id: analysisId,
      method,
      independentVar,
      dependentVar,
      timestamp,
      dataSize: xData.length,
      statistics,
      chart
    };
  }

  getAnalysisHandler(method, { strict = false } = {}) {
    const handler = this.analysisHandlers[method];
    if (!handler && strict) {
      throw new Error('지원하지 않는 분석 방법입니다.');
    }
    return handler;
  }

  getNumericData(field) {
    return this.data.reduce((values, row) => {
      const value = Number.parseFloat(row[field]);
      if (Number.isFinite(value)) {
        values.push(value);
      }
      return values;
    }, []);
  }

  validateNumericData(...datasets) {
    const hasInvalidDataset = datasets.some(data => !Array.isArray(data) || data.length === 0);

    if (hasInvalidDataset) {
      throw new Error('유효한 수치형 데이터가 필요합니다.');
    }
  }

  formatSignificance(isSignificant, detailed = false) {
    const label = isSignificant ? '유의함' : '유의하지 않음';
    return detailed ? `통계적으로 ${label}` : label;
  }

  // 차트 생성 함수들
  createHistogramChart(xData, yData, xLabel, yLabel) {
    const trace1 = {
      x: xData,
      type: 'histogram',
      name: xLabel,
      opacity: 0.7
    };

    const trace2 = {
      x: yData,
      type: 'histogram',
      name: yLabel,
      opacity: 0.7
    };

    return {
      data: [trace1, trace2],
      layout: {
        title: '히스토그램',
        barmode: 'overlay',
        xaxis: { title: '값' },
        yaxis: { title: '빈도' }
      }
    };
  }

  createScatterChart(xData, yData, xLabel, yLabel) {
    const trace = {
      x: xData,
      y: yData,
      mode: 'markers',
      type: 'scatter',
      name: '데이터 포인트'
    };

    return {
      data: [trace],
      layout: {
        title: '산점도',
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      }
    };
  }

  createRegressionChart(xData, yData, xLabel, yLabel, regression) {
    const trace1 = {
      x: xData,
      y: yData,
      mode: 'markers',
      type: 'scatter',
      name: '데이터 포인트'
    };

    const xRange = [Math.min(...xData), Math.max(...xData)];
    const yPred = xRange.map(x => regression.slope * x + regression.intercept);
    
    const trace2 = {
      x: xRange,
      y: yPred,
      mode: 'lines',
      type: 'scatter',
      name: '회귀선',
      line: { color: 'red' }
    };

    return {
      data: [trace1, trace2],
      layout: {
        title: `단순선형회귀 (R² = ${regression.r2.toFixed(3)})`,
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      }
    };
  }

  // 결과 렌더링
  renderResults(result) {
    this.renderTableResult(result);
    this.renderChartResult(result);
    this.renderSummaryResult(result);
  }

  // 표 결과 렌더링
  renderTableResult(result) {
    const container = Utils.DOM.$('#resultTableContainer');
    const handler = this.getAnalysisHandler(result.method);
    const emptyMessage = '<p class="text-secondary">이 분석에는 표 형태의 결과가 없습니다.</p>';

    if (!result.statistics || !handler || !handler.buildTable) {
      container.innerHTML = emptyMessage;
      return;
    }

    const tableConfig = handler.buildTable(result);

    if (!tableConfig) {
      container.innerHTML = emptyMessage;
      return;
    }

    const { headers = [], rows = [], options = {} } = tableConfig;

    if (!rows || rows.length === 0) {
      container.innerHTML = emptyMessage;
      return;
    }

    const table = Components.Table.create(rows, {
      headers,
      sortable: false,
      searchable: false,
      pagination: false,
      ...options
    });

    container.innerHTML = '';
    container.appendChild(table);
  }

  // 차트 결과 렌더링
  renderChartResult(result) {
    const container = Utils.DOM.$('#resultChartContainer');
    
    if (!result.chart) {
      container.innerHTML = '<p class="text-secondary">이 분석에는 차트가 없습니다.</p>';
      return;
    }
    
    container.innerHTML = '<div id="chart"></div>';
    
    Plotly.newPlot('chart', result.chart.data, result.chart.layout, {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
    });
  }

  // 요약 결과 렌더링
  renderSummaryResult(result) {
    const container = Utils.DOM.$('#resultSummaryContainer');
    
    let summary = `
      <div class="card">
        <div class="card-body">
          <h4>분석 요약</h4>
          <ul>
            <li><strong>분석 방법:</strong> ${this.getMethodName(result.method)}</li>
            <li><strong>독립변수:</strong> ${result.independentVar}</li>
            <li><strong>종속변수:</strong> ${result.dependentVar}</li>
            <li><strong>데이터 크기:</strong> ${result.dataSize}개</li>
            <li><strong>분석 시간:</strong> ${new Date(result.timestamp).toLocaleString()}</li>
          </ul>
        </div>
      </div>
    `;
    
    if (result.statistics) {
      summary += `
        <div class="card mt-3">
          <div class="card-body">
            <h4>주요 결과</h4>
            ${this.getStatisticsSummary(result)}
          </div>
        </div>
      `;
    }
    
    container.innerHTML = summary;
  }

  // 분석 방법 이름 가져오기
  getMethodName(method) {
    const handler = this.getAnalysisHandler(method);
    return handler?.name || method;
  }

  // 통계 요약 가져오기
  getStatisticsSummary(result) {
    const defaultMessage = '<p>상세한 통계 결과는 표 탭에서 확인하세요.</p>';

    if (!result.statistics) {
      return defaultMessage;
    }

    const handler = this.getAnalysisHandler(result.method);

    if (!handler || !handler.buildSummary) {
      return defaultMessage;
    }

    return handler.buildSummary(result) || defaultMessage;
  }

  // 분석 결과 표시
  showAnalysisResults() {
    Utils.DOM.$('#analysisResultsCard').style.display = 'block';
    Utils.DOM.$('#analysisResultsCard').scrollIntoView({ behavior: 'smooth' });
  }

  // 히스토리에 추가
  addToHistory(result) {
    this.analysisHistory.unshift({
      id: result.id,
      method: result.method,
      independentVar: result.independentVar,
      dependentVar: result.dependentVar,
      timestamp: result.timestamp,
      methodName: this.getMethodName(result.method)
    });
    
    if (this.analysisHistory.length > 10) {
      this.analysisHistory = this.analysisHistory.slice(0, 10);
    }
    
    this.saveAnalysisHistory();
    this.renderAnalysisHistory();
  }

  // 히스토리 렌더링
  renderAnalysisHistory() {
    const container = Utils.DOM.$('#analysisHistoryContainer');
    
    if (this.analysisHistory.length === 0) {
      container.innerHTML = '<p class="text-secondary">분석 히스토리가 없습니다.</p>';
      return;
    }
    
    const historyList = this.analysisHistory.map(item => `
      <div class="card mb-2">
        <div class="card-body p-3">
          <div class="d-flex justify-between align-center">
            <div>
              <h6 class="mb-1">${item.methodName}</h6>
              <p class="text-secondary mb-0">${item.independentVar} → ${item.dependentVar}</p>
              <small class="text-secondary">${new Date(item.timestamp).toLocaleString()}</small>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = historyList;
    Utils.DOM.$('#analysisHistoryCard').style.display = 'block';
  }

  // 히스토리 저장
  saveAnalysisHistory() {
    Utils.Storage.set(CONFIG.STORAGE.ANALYSIS_HISTORY, this.analysisHistory);
  }

  // 히스토리 로드
  loadAnalysisHistory() {
    this.analysisHistory = Utils.Storage.get(CONFIG.STORAGE.ANALYSIS_HISTORY, []);
    this.renderAnalysisHistory();
  }

  // 탭 전환
  switchTab(tabName) {
    Utils.DOM.$$('.tab').forEach(tab => tab.classList.remove('active'));
    Utils.DOM.$$('.tab-content').forEach(content => content.classList.remove('active'));
    
    Utils.DOM.$(`[data-tab="${tabName}"]`).classList.add('active');
    Utils.DOM.$(`#${tabName}Result`).classList.add('active');
  }

  // 테마 설정
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Utils.Storage.set('theme', theme);
    
    const themeToggle = Utils.DOM.$('#themeToggle span');
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // UI 업데이트
  updateUI() {
    const hasData = this.data.length > 0;
    const hasAnalysis = this.currentAnalysis !== null;
    
    Utils.DOM.$('#runAnalysisBtn').disabled = !hasData;
    Utils.DOM.$('#analysisResultsCard').style.display = hasAnalysis ? 'block' : 'none';
    Utils.DOM.$('#analysisHistoryCard').style.display = this.analysisHistory.length > 0 ? 'block' : 'none';
  }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StatsApp();
});
