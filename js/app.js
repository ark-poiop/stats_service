// 메인 애플리케이션 로직
class StatsApp {
  constructor() {
    this.data = [];
    this.fields = [];
    this.currentAnalysis = null;
    this.analysisHistory = [];
    
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
      
      Components.Spinner.hide(spinner);
      Components.Toast.success('분석이 완료되었습니다!');
      
    } catch (error) {
      Components.Spinner.hide(spinner);
      Components.Toast.error(`분석 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  // 분석 수행
  performAnalysis(method, independentVar, dependentVar) {
    const xData = this.data.map(row => parseFloat(row[independentVar])).filter(v => !isNaN(v));
    const yData = this.data.map(row => parseFloat(row[dependentVar])).filter(v => !isNaN(v));
    
    if (xData.length === 0 || yData.length === 0) {
      throw new Error('유효한 수치형 데이터가 필요합니다.');
    }
    
    const timestamp = new Date().toISOString();
    const analysisId = `analysis_${timestamp}`;
    
    let result = {
      id: analysisId,
      method,
      independentVar,
      dependentVar,
      timestamp,
      dataSize: xData.length,
      statistics: null,
      chart: null
    };
    
    switch (method) {
      // 기술통계 분석
      case 'descriptive':
        result.statistics = {
          x: Statistics.Descriptive.calculate(xData),
          y: Statistics.Descriptive.calculate(yData)
        };
        result.chart = this.createHistogramChart(xData, yData, independentVar, dependentVar);
        break;

      case 'dispersion':
        result.statistics = {
          x: Statistics.Descriptive.dispersion(xData),
          y: Statistics.Descriptive.dispersion(yData)
        };
        result.chart = this.createBoxPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'distribution':
        result.statistics = {
          x: Statistics.Descriptive.distribution(xData),
          y: Statistics.Descriptive.distribution(yData)
        };
        result.chart = this.createQQPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'frequency':
        result.statistics = {
          x: Statistics.Descriptive.frequency(xData),
          y: Statistics.Descriptive.frequency(yData)
        };
        result.chart = this.createHistogramChart(xData, yData, independentVar, dependentVar);
        break;
        
      // 시각화
      case 'histogram':
        result.statistics = {
          x: Statistics.Descriptive.calculate(xData),
          y: Statistics.Descriptive.calculate(yData)
        };
        result.chart = this.createHistogramChart(xData, yData, independentVar, dependentVar);
        break;

      case 'boxplot':
        result.statistics = {
          x: Statistics.Descriptive.dispersion(xData),
          y: Statistics.Descriptive.dispersion(yData)
        };
        result.chart = this.createBoxPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'scatter':
        result.statistics = Statistics.Correlation.pearson(xData, yData);
        result.chart = this.createScatterChart(xData, yData, independentVar, dependentVar);
        break;

      case 'heatmap':
        result.statistics = Statistics.Correlation.pearson(xData, yData);
        result.chart = this.createHeatmapChart(xData, yData, independentVar, dependentVar);
        break;

      case 'timeseries':
        result.statistics = Statistics.TimeSeries.analyze(xData, yData);
        result.chart = this.createTimeSeriesChart(xData, yData, independentVar, dependentVar);
        break;

      // 상관 및 회귀
      case 'regression-simple':
        result.statistics = Statistics.Regression.simpleLinear(xData, yData);
        result.chart = this.createRegressionChart(xData, yData, independentVar, dependentVar, result.statistics);
        break;

      // 가설검정
      case 'ttest-ind':
        result.statistics = Statistics.HypothesisTest.independentTTest(xData, yData);
        result.chart = this.createBoxPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'ttest-paired':
        result.statistics = Statistics.HypothesisTest.pairedTTest(xData, yData);
        result.chart = this.createScatterChart(xData, yData, independentVar, dependentVar);
        break;

      case 'anova-one':
        // ANOVA는 두 개 이상의 그룹이 필요하므로, 데이터를 그룹화
        const groups = this.groupDataForANOVA(xData, yData);
        result.statistics = Statistics.HypothesisTest.oneWayANOVA(groups);
        result.chart = this.createBoxPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'chi-square':
        result.statistics = Statistics.HypothesisTest.chiSquareTest(xData, yData);
        result.chart = this.createBarChart(xData, yData, independentVar, dependentVar);
        break;

      // 비모수 검정
      case 'mann-whitney':
        result.statistics = Statistics.NonParametric.mannWhitney(xData, yData);
        result.chart = this.createBoxPlotChart(xData, yData, independentVar, dependentVar);
        break;

      case 'wilcoxon':
        result.statistics = Statistics.NonParametric.wilcoxonSignedRank(xData, yData);
        result.chart = this.createScatterChart(xData, yData, independentVar, dependentVar);
        break;
        
      default:
        throw new Error('지원하지 않는 분석 방법입니다.');
    }
    
    return result;
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

  // 박스플롯 차트 생성
  createBoxPlotChart(xData, yData, xLabel, yLabel) {
    const trace1 = {
      y: xData,
      type: 'box',
      name: xLabel,
      boxpoints: 'outliers'
    };

    const trace2 = {
      y: yData,
      type: 'box',
      name: yLabel,
      boxpoints: 'outliers'
    };

    return {
      data: [trace1, trace2],
      layout: {
        title: '박스플롯',
        showlegend: true,
        yaxis: { title: '값' }
      }
    };
  }

  // Q-Q 플롯 차트 생성
  createQQPlotChart(xData, yData, xLabel, yLabel) {
    // 정규분포 이론적 분위수 계산
    const calculateTheoretical = (data) => {
      const n = data.length;
      const sorted = [...data].sort((a, b) => a - b);
      return sorted.map((_, i) => {
        const p = (i + 0.5) / n;
        return ss.probit(p);
      });
    };

    const trace1 = {
      x: calculateTheoretical(xData),
      y: [...xData].sort((a, b) => a - b),
      mode: 'markers',
      type: 'scatter',
      name: xLabel
    };

    const trace2 = {
      x: calculateTheoretical(yData),
      y: [...yData].sort((a, b) => a - b),
      mode: 'markers',
      type: 'scatter',
      name: yLabel
    };

    return {
      data: [trace1, trace2],
      layout: {
        title: 'Q-Q Plot (정규성 검정)',
        xaxis: { title: '이론적 분위수' },
        yaxis: { title: '관측 분위수' }
      }
    };
  }

  // 히트맵 차트 생성
  createHeatmapChart(xData, yData, xLabel, yLabel) {
    const correlationMatrix = [
      [1, Statistics.Correlation.pearson(xData, yData).correlation],
      [Statistics.Correlation.pearson(yData, xData).correlation, 1]
    ];

    const trace = {
      z: correlationMatrix,
      x: [xLabel, yLabel],
      y: [xLabel, yLabel],
      type: 'heatmap',
      colorscale: 'RdBu',
      zmin: -1,
      zmax: 1
    };

    return {
      data: [trace],
      layout: {
        title: '상관관계 히트맵',
        width: 500,
        height: 500
      }
    };
  }

  // 시계열 차트 생성
  createTimeSeriesChart(xData, yData, xLabel, yLabel) {
    const trace1 = {
      x: Array.from({ length: xData.length }, (_, i) => i),
      y: xData,
      mode: 'lines+markers',
      name: xLabel
    };

    const trace2 = {
      x: Array.from({ length: yData.length }, (_, i) => i),
      y: yData,
      mode: 'lines+markers',
      name: yLabel
    };

    return {
      data: [trace1, trace2],
      layout: {
        title: '시계열 그래프',
        xaxis: { title: '시점' },
        yaxis: { title: '값' }
      }
    };
  }

  // ANOVA를 위한 데이터 그룹화
  groupDataForANOVA(xData, yData) {
    // 독립변수의 고유값을 기준으로 그룹화
    const uniqueX = [...new Set(xData)];
    return uniqueX.map(x => 
      yData.filter((_, i) => xData[i] === x)
    );
  }

  // 막대 차트 생성
  createBarChart(xData, yData, xLabel, yLabel) {
    // 빈도수 계산
    const frequencies = {};
    xData.forEach((x, i) => {
      const key = `${x}-${yData[i]}`;
      frequencies[key] = (frequencies[key] || 0) + 1;
    });

    // 데이터 포인트 생성
    const uniqueX = [...new Set(xData)];
    const uniqueY = [...new Set(yData)];
    const data = [];

    uniqueX.forEach(x => {
      const trace = {
        x: uniqueY,
        y: uniqueY.map(y => frequencies[`${x}-${y}`] || 0),
        name: String(x),
        type: 'bar'
      };
      data.push(trace);
    });

    return {
      data,
      layout: {
        title: '범주형 데이터 분포',
        barmode: 'group',
        xaxis: { title: yLabel },
        yaxis: { title: '빈도' }
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
    
    if (!result.statistics) {
      container.innerHTML = '<p class="text-secondary">이 분석에는 표 형태의 결과가 없습니다.</p>';
      return;
    }
    
    let tableData = [];
    let headers = [];
    
    if (result.method === 'descriptive') {
      headers = ['변수', '평균', '중앙값', '표준편차', '최소값', '최대값'];
      tableData = [
        [result.independentVar, 
         result.statistics.x.mean.toFixed(3),
         result.statistics.x.median.toFixed(3),
         result.statistics.x.std.toFixed(3),
         result.statistics.x.min.toFixed(3),
         result.statistics.x.max.toFixed(3)],
        [result.dependentVar,
         result.statistics.y.mean.toFixed(3),
         result.statistics.y.median.toFixed(3),
         result.statistics.y.std.toFixed(3),
         result.statistics.y.min.toFixed(3),
         result.statistics.y.max.toFixed(3)]
      ];
    } else if (result.method === 'scatter') {
      headers = ['분석 유형', '상관계수', 'p-값', '유의성', '강도'];
      tableData = [[
        '피어슨 상관분석',
        result.statistics.correlation.toFixed(3),
        result.statistics.pValue.toFixed(4),
        result.statistics.significant ? '유의함' : '유의하지 않음',
        result.statistics.strength
      ]];
    } else if (result.method === 'regression-simple') {
      headers = ['계수', '값', '해석'];
      tableData = [
        ['절편', result.statistics.intercept.toFixed(3), '기준값'],
        ['기울기', result.statistics.slope.toFixed(3), '변화율'],
        ['R²', result.statistics.r2.toFixed(3), '설명력'],
        ['p-값', result.statistics.pValue.toFixed(4), result.statistics.significant ? '유의함' : '유의하지 않음']
      ];
    }
    
    const table = Components.Table.create(tableData, {
      headers,
      sortable: false,
      searchable: false,
      pagination: false
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
    const methodNames = {
      'descriptive': '기초통계량',
      'scatter': '산점도',
      'regression-simple': '단순선형회귀'
    };
    
    return methodNames[method] || method;
  }

  // 통계 요약 가져오기
  getStatisticsSummary(result) {
    if (result.method === 'scatter') {
      return `
        <ul>
          <li><strong>상관계수:</strong> ${result.statistics.correlation.toFixed(3)}</li>
          <li><strong>p-값:</strong> ${result.statistics.pValue.toFixed(4)}</li>
          <li><strong>유의성:</strong> ${result.statistics.significant ? '통계적으로 유의함' : '통계적으로 유의하지 않음'}</li>
          <li><strong>상관관계 강도:</strong> ${result.statistics.strength}</li>
        </ul>
      `;
    } else if (result.method === 'regression-simple') {
      return `
        <ul>
          <li><strong>R²:</strong> ${result.statistics.r2.toFixed(3)}</li>
          <li><strong>회귀식:</strong> ${result.statistics.equation}</li>
          <li><strong>p-값:</strong> ${result.statistics.pValue.toFixed(4)}</li>
          <li><strong>유의성:</strong> ${result.statistics.significant ? '통계적으로 유의함' : '통계적으로 유의하지 않음'}</li>
        </ul>
      `;
    }
    
    return '<p>상세한 통계 결과는 표 탭에서 확인하세요.</p>';
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
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new StatsApp();
});

// 전역 함수로 노출
window.app = app;
