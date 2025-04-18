<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>웹기반 통계 분석 툴 (MVP)</title>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mathjs@9.4.4/lib/browser/math.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/simple-statistics@7.7.0/dist/simple-statistics.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600&display=swap');
    
    :root {
      --primary-color: #2196F3;
      --secondary-color: #f5f5f5;
      --text-color: #333;
      --border-radius: 8px;
      --shadow: 0 2px 8px rgba(0,0,0,0.1);
      --header-height: 60px;
      --footer-height: 60px;
      --sidebar-width: 280px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Pretendard', sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: #f9f9f9;
      height: 100vh;
      display: grid;
      grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-rows: var(--header-height) 1fr var(--footer-height);
    }

    /* 헤더 스타일 */
    .header {
      grid-area: header;
      background: white;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      box-shadow: var(--shadow);
      z-index: 100;
    }

    .header h1 {
      font-size: 1.5rem;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* 사이드바 스타일 */
    .sidebar {
      grid-area: sidebar;
      background: white;
      padding: 2rem;
      box-shadow: var(--shadow);
      overflow-y: auto;
    }

    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* 메인 컨텐츠 영역 */
    .main {
      grid-area: main;
      padding: 2rem;
      overflow-y: auto;
    }

    /* 푸터 스타일 */
    .footer {
      grid-area: footer;
      background: white;
      padding: 1rem 2rem;
      text-align: center;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
    }

    .card {
      background: white;
      border-radius: var(--border-radius);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
    }

    .button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--border-radius);
      background: var(--primary-color);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
    }

    .button-secondary {
      background: var(--secondary-color);
      color: var(--text-color);
    }

    .file-upload {
      border: 2px dashed #ddd;
      border-radius: var(--border-radius);
      padding: 2rem;
      text-align: center;
      margin: 1rem 0;
      cursor: pointer;
      transition: all 0.2s;
    }

    .file-upload:hover {
      border-color: var(--primary-color);
      background: #f8f9fa;
    }

    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: var(--border-radius);
      margin: 0.5rem 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      padding: 0.75rem;
      border: 1px solid #eee;
      text-align: left;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .tab {
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab.active {
      background: var(--primary-color);
      color: white;
    }

    #plotArea {
      width: 100%;
      height: 400px;
      margin: 1rem 0;
    }

    @media (max-width: 768px) {
      body {
        grid-template-areas:
          "header"
          "main"
          "footer";
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: none;
      }

      .main {
        padding: 1rem;
      }
    }

    .export-section {
      margin-top: 2rem;
    }

    .export-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .export-buttons .button {
      width: auto;
      margin-bottom: 0;
    }

    @media (max-width: 768px) {
      .export-buttons {
        flex-direction: column;
      }
      
      .export-buttons .button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <!-- 헤더 -->
  <header class="header">
    <h1>📊 통계 분석 도구</h1>
  </header>

  <!-- 사이드바 -->
  <aside class="sidebar">
    <div class="sidebar-menu">
      <h2>📌 데이터 업로드</h2>
      <div class="file-upload" id="dropZone">
        <p>파일을 드래그하여 업로드하거나 클릭하여 선택하세요</p>
        <input type="file" id="fileInput" accept=".csv,.xlsx" style="display: none;">
      </div>
      <button class="button" id="sampleDataBtn">샘플 데이터로 시작</button>

      <h2>⚙️ 분석 설정</h2>
      <select id="analysis-method">
        <option disabled selected>분석 방법 선택</option>
        <optgroup label="기술통계">
          <option value="descriptive">기초통계량 (평균, 중앙값, 최빈값)</option>
          <option value="dispersion">산포도 (표준편차, 분산, 범위)</option>
          <option value="distribution">분포 (사분위수, 비대칭도, 첨도)</option>
          <option value="frequency">도수분포표</option>
        </optgroup>
        <optgroup label="시각화">
          <option value="histogram">히스토그램</option>
          <option value="boxplot">박스플롯</option>
          <option value="scatter">산점도</option>
        </optgroup>
        <optgroup label="가설검정">
          <option value="ttest-ind">독립표본 t-검정</option>
          <option value="ttest-paired">대응표본 t-검정</option>
          <option value="anova-one">일원분산분석</option>
          <option value="anova-two">이원분산분석</option>
          <option value="chi-square">카이제곱 검정</option>
        </optgroup>
        <optgroup label="상관 및 회귀">
          <option value="correlation-pearson">피어슨 상관분석</option>
          <option value="correlation-spearman">스피어만 상관분석</option>
          <option value="regression-simple">단순 선형 회귀</option>
          <option value="regression-multiple">다중 회귀</option>
          <option value="regression-logistic">로지스틱 회귀</option>
        </optgroup>
        <optgroup label="비모수 검정">
          <option value="mann-whitney">맨휘트니 U 검정</option>
          <option value="wilcoxon">윌콕슨 부호 순위 검정</option>
          <option value="kruskal-wallis">크루스칼-왈리스 검정</option>
        </optgroup>
      </select>

      <div id="variable-selection">
        <select id="independent-variable">
          <option disabled selected>독립변수 선택</option>
        </select>
        
        <select id="dependent-variable">
          <option disabled selected>종속변수 선택</option>
        </select>

        <div id="additional-options" style="display: none;">
          <select id="grouping-variable">
            <option disabled selected>그룹 변수 선택</option>
          </select>
          
          <select id="additional-vars" multiple>
            <option disabled selected>추가 변수 선택 (다중 선택 가능)</option>
          </select>
        </div>
      </div>
      
      <button class="button" onclick="runAnalysis()">분석 실행</button>
    </div>
  </aside>

  <!-- 메인 컨텐츠 -->
  <main class="main">
    <div class="card">
      <h2>📋 데이터 미리보기</h2>
      <div style="overflow-x: auto;">
        <table id="previewTable">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>📈 분석 결과</h2>
      <div class="tabs">
        <div class="tab active" data-view="table">표</div>
        <div class="tab" data-view="plot">그래프</div>
      </div>
      
      <div id="resultArea">
        <table id="resultTable">
          <thead></thead>
          <tbody></tbody>
        </table>
        <div id="plotArea"></div>
      </div>
    </div>

    <!-- 결과 내보내기 섹션 -->
    <div class="card export-section">
      <h2>📥 결과 내보내기</h2>
      <div class="export-buttons">
        <button class="button button-secondary" onclick="exportToCSV()">
          <span>📊 CSV 다운로드</span>
        </button>
        <button class="button button-secondary" onclick="exportGraph()">
          <span>📈 그래프 다운로드 (PNG)</span>
        </button>
        <button class="button" onclick="exportToPDF()">
          <span>📄 PDF 보고서 생성</span>
        </button>
      </div>
    </div>

    <script>
      // 결과 내보내기 함수들
      function exportToCSV() {
        const table = document.getElementById('resultTable');
        const rows = Array.from(table.querySelectorAll('tr'));
        
        // CSV 데이터 생성
        const csvData = rows.map(row => 
          Array.from(row.querySelectorAll('th,td'))
            .map(cell => `"${cell.textContent}"`)
            .join(',')
        ).join('\n');
        
        // CSV 파일 다운로드
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '분석결과.csv';
        link.click();
      }

      function exportGraph() {
        const plotArea = document.getElementById('plotArea');
        
        // Plotly 그래프를 PNG 이미지로 변환
        Plotly.toImage(plotArea, {
          format: 'png',
          width: 800,
          height: 600
        }).then(function(dataUrl) {
          // 이미지 다운로드
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = '분석그래프.png';
          link.click();
        });
      }

      function exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // 제목 추가
        doc.setFontSize(16);
        doc.text('통계 분석 보고서', 20, 20);
        doc.setFontSize(12);
        
        // 분석 정보 추가
        const analysisType = document.getElementById('analysis-method').value;
        const xVar = document.getElementById('independent-variable').value;
        const yVar = document.getElementById('dependent-variable').value;
        doc.text(`분석 유형: ${analysisType}`, 20, 30);
        doc.text(`X 변수: ${xVar}`, 20, 40);
        doc.text(`Y 변수: ${yVar}`, 20, 50);
        
        // 결과 테이블 추가
        const table = document.getElementById('resultTable');
        const rows = Array.from(table.querySelectorAll('tr'));
        let yPos = 70;
        
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('th,td'));
          let xPos = 20;
          
          cells.forEach(cell => {
            doc.text(cell.textContent, xPos, yPos);
            xPos += 40;
          });
          
          yPos += 10;
          
          // 페이지 넘김 처리
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
        
        // 그래프 추가
        const plotArea = document.getElementById('plotArea');
        Plotly.toImage(plotArea, {
          format: 'png',
          width: 800,
          height: 600
        }).then(function(dataUrl) {
          // 이미지를 PDF에 추가
          const img = new Image();
          img.src = dataUrl;
          img.onload = function() {
            doc.addPage();
            doc.addImage(img, 'PNG', 20, 20, 170, 170);
            doc.save('분석보고서.pdf');
          };
        });
      }

      // 내보내기 유형에 따른 옵션 표시/숨김
      document.getElementById('export-type').addEventListener('change', function() {
        const graphTypeSelect = document.getElementById('graph-type');
        graphTypeSelect.style.display = this.value === 'graph' ? 'block' : 'none';
      });
    </script>
  </main>

  <!-- 푸터 -->
  <footer class="footer">
    <p>© 2024 통계 분석 도구 | 문의: support@stats-tool.com</p>
  </footer>

  <script>
    let uploadedData = [];
    let currentView = 'table';

    // 파일 드래그 앤 드롭 기능
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#2196F3';
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#ddd';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#ddd';
      const files = e.dataTransfer.files;
      if (files.length) handleFile(files[0]);
    });

    document.getElementById('fileInput').addEventListener('change', function(e) {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          uploadedData = results.data;
          renderPreviewTable(results.meta.fields, results.data);
          populateVariableSelectors(results.meta.fields);
        }
      });
    }

    function renderPreviewTable(fields, data) {
      const thead = document.querySelector('#previewTable thead');
      const tbody = document.querySelector('#previewTable tbody');
      thead.innerHTML = '<tr>' + fields.map(f => `<th>${f}</th>`).join('') + '</tr>';
      tbody.innerHTML = data.slice(0, 5).map(row => {
        return '<tr>' + fields.map(f => `<td>${row[f]}</td>`).join('') + '</tr>';
      }).join('');
    }

    function populateVariableSelectors(fields) {
      const indep = document.getElementById('independent-variable');
      const dep = document.getElementById('dependent-variable');
      const options = fields.map(f => `<option value="${f}">${f}</option>`).join('');
      indep.innerHTML = '<option disabled selected>독립변수 선택</option>' + options;
      dep.innerHTML = '<option disabled selected>종속변수 선택</option>' + options;
    }

    function runAnalysis() {
      const method = document.getElementById('analysis-method').value;
      const y = document.getElementById('dependent-variable').value;
      const x = document.getElementById('independent-variable').value;
      
      if (!method || !y || !x) {
        alert('필수 분석 옵션을 선택해주세요.');
        return;
      }

      const yData = uploadedData.map(row => parseFloat(row[y])).filter(v => !isNaN(v));
      const xData = uploadedData.map(row => parseFloat(row[x])).filter(v => !isNaN(v));

      if (yData.length === 0 || xData.length === 0) {
        alert('유효한 수치형 데이터가 필요합니다.');
        return;
      }

      // 분석 방법에 따른 함수 호출
      switch (method) {
        // 기술통계
        case 'descriptive':
          showDescriptiveStats(x, y, xData, yData);
          break;
        case 'dispersion':
          showDispersionStats(x, y, xData, yData);
          break;
        case 'distribution':
          showDistributionStats(x, y, xData, yData);
          break;
        case 'frequency':
          showFrequencyTable(x, y, xData, yData);
          break;

        // 시각화
        case 'histogram':
          showHistogram(x, y, xData, yData);
          break;
        case 'boxplot':
          showBoxPlot(x, y, xData, yData);
          break;
        case 'scatter':
          showScatterPlot(x, y, xData, yData);
          break;

        // 가설검정
        case 'ttest-ind':
          performIndependentTTest(x, y, xData, yData);
          break;
        case 'ttest-paired':
          performPairedTTest(x, y, xData, yData);
          break;
        case 'anova-one':
          performOneWayANOVA(x, y, xData, yData);
          break;
        case 'chi-square':
          performChiSquareTest(x, y, xData, yData);
          break;

        // 상관 및 회귀
        case 'correlation-pearson':
          showPearsonCorrelation(x, y, xData, yData);
          break;
        case 'correlation-spearman':
          showSpearmanCorrelation(x, y, xData, yData);
          break;
        case 'regression-simple':
          performSimpleRegression(x, y, xData, yData);
          break;
        case 'regression-multiple':
          performMultipleRegression(x, y, xData, yData);
          break;

        // 비모수 검정
        case 'mann-whitney':
          performMannWhitneyTest(x, y, xData, yData);
          break;
        case 'wilcoxon':
          performWilcoxonTest(x, y, xData, yData);
          break;
        case 'kruskal-wallis':
          performKruskalWallisTest(x, y, xData, yData);
          break;
      }
    }

    // 기술통계 함수들
    function showDescriptiveStats(xLabel, yLabel, xData, yData) {
      const xStats = calculateDescriptiveStats(xData);
      const yStats = calculateDescriptiveStats(yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>변수</th>
          <th>평균</th>
          <th>중앙값</th>
          <th>최빈값</th>
          <th>표준편차</th>
          <th>최소값</th>
          <th>최대값</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>${xLabel}</td>
          <td>${xStats.mean}</td>
          <td>${xStats.median}</td>
          <td>${xStats.mode}</td>
          <td>${xStats.std}</td>
          <td>${xStats.min}</td>
          <td>${xStats.max}</td>
        </tr>
        <tr>
          <td>${yLabel}</td>
          <td>${yStats.mean}</td>
          <td>${yStats.median}</td>
          <td>${yStats.mode}</td>
          <td>${yStats.std}</td>
          <td>${yStats.min}</td>
          <td>${yStats.max}</td>
        </tr>
      `;

      // 히스토그램 시각화
      showHistogram(xLabel, yLabel, xData, yData);
    }

    function calculateDescriptiveStats(data) {
      return {
        mean: ss.mean(data).toFixed(2),
        median: ss.median(data).toFixed(2),
        mode: ss.mode(data).toFixed(2),
        std: ss.standardDeviation(data).toFixed(2),
        variance: ss.variance(data).toFixed(2),
        min: Math.min(...data).toFixed(2),
        max: Math.max(...data).toFixed(2),
        q1: ss.quantile(data, 0.25).toFixed(2),
        q3: ss.quantile(data, 0.75).toFixed(2),
        skewness: ss.sampleSkewness(data).toFixed(2),
        kurtosis: ss.sampleKurtosis(data).toFixed(2)
      };
    }

    // 산포도 분석
    function showDispersionStats(xLabel, yLabel, xData, yData) {
      const xStats = calculateDispersionStats(xData);
      const yStats = calculateDispersionStats(yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>변수</th>
          <th>표준편차</th>
          <th>분산</th>
          <th>범위</th>
          <th>사분위수 범위</th>
          <th>변동계수</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>${xLabel}</td>
          <td>${xStats.std}</td>
          <td>${xStats.variance}</td>
          <td>${xStats.range}</td>
          <td>${xStats.iqr}</td>
          <td>${xStats.cv}%</td>
        </tr>
        <tr>
          <td>${yLabel}</td>
          <td>${yStats.std}</td>
          <td>${yStats.variance}</td>
          <td>${yStats.range}</td>
          <td>${yStats.iqr}</td>
          <td>${yStats.cv}%</td>
        </tr>
      `;

      // 박스플롯으로 시각화
      showBoxPlot(xLabel, yLabel, xData, yData);
    }

    function calculateDispersionStats(data) {
      const mean = ss.mean(data);
      const std = ss.standardDeviation(data);
      const q1 = ss.quantile(data, 0.25);
      const q3 = ss.quantile(data, 0.75);
      
      return {
        std: std.toFixed(2),
        variance: ss.variance(data).toFixed(2),
        range: (Math.max(...data) - Math.min(...data)).toFixed(2),
        iqr: (q3 - q1).toFixed(2),
        cv: ((std / mean) * 100).toFixed(2)
      };
    }

    // 분포 분석
    function showDistributionStats(xLabel, yLabel, xData, yData) {
      const xStats = calculateDistributionStats(xData);
      const yStats = calculateDistributionStats(yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>변수</th>
          <th>제1사분위수</th>
          <th>제2사분위수</th>
          <th>제3사분위수</th>
          <th>비대칭도</th>
          <th>첨도</th>
          <th>정규성</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>${xLabel}</td>
          <td>${xStats.q1}</td>
          <td>${xStats.q2}</td>
          <td>${xStats.q3}</td>
          <td>${xStats.skewness}</td>
          <td>${xStats.kurtosis}</td>
          <td>${xStats.normality}</td>
        </tr>
        <tr>
          <td>${yLabel}</td>
          <td>${yStats.q1}</td>
          <td>${yStats.q2}</td>
          <td>${yStats.q3}</td>
          <td>${yStats.skewness}</td>
          <td>${yStats.kurtosis}</td>
          <td>${yStats.normality}</td>
        </tr>
      `;

      // QQ플롯으로 시각화
      showQQPlot(xLabel, yLabel, xData, yData);
    }

    function calculateDistributionStats(data) {
      const skewness = ss.sampleSkewness(data);
      const kurtosis = ss.sampleKurtosis(data);
      
      return {
        q1: ss.quantile(data, 0.25).toFixed(2),
        q2: ss.quantile(data, 0.50).toFixed(2),
        q3: ss.quantile(data, 0.75).toFixed(2),
        skewness: skewness.toFixed(2),
        kurtosis: kurtosis.toFixed(2),
        normality: interpretNormality(skewness, kurtosis)
      };
    }

    function interpretNormality(skewness, kurtosis) {
      const skewThreshold = 0.5;
      const kurtThreshold = 0.5;
      
      if (Math.abs(skewness) < skewThreshold && Math.abs(kurtosis) < kurtThreshold) {
        return '정규분포에 가까움';
      } else if (Math.abs(skewness) < skewThreshold) {
        return '비대칭도는 정상이나 첨도에 차이 있음';
      } else if (Math.abs(kurtosis) < kurtThreshold) {
        return '첨도는 정상이나 비대칭도에 차이 있음';
      }
      return '정규분포와 차이 있음';
    }

    // 도수분포표
    function showFrequencyTable(xLabel, yLabel, xData, yData) {
      const xFreq = calculateFrequencyTable(xData);
      const yFreq = calculateFrequencyTable(yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>변수</th>
          <th>구간</th>
          <th>도수</th>
          <th>상대도수</th>
          <th>누적도수</th>
          <th>누적상대도수</th>
        </tr>
      `;
      
      tbody.innerHTML = xFreq.intervals.map((interval, i) => `
        <tr>
          <td>${i === 0 ? xLabel : ''}</td>
          <td>${interval}</td>
          <td>${xFreq.frequencies[i]}</td>
          <td>${xFreq.relativeFreq[i]}%</td>
          <td>${xFreq.cumulativeFreq[i]}</td>
          <td>${xFreq.cumulativeRelFreq[i]}%</td>
        </tr>
      `).join('') + yFreq.intervals.map((interval, i) => `
        <tr>
          <td>${i === 0 ? yLabel : ''}</td>
          <td>${interval}</td>
          <td>${yFreq.frequencies[i]}</td>
          <td>${yFreq.relativeFreq[i]}%</td>
          <td>${yFreq.cumulativeFreq[i]}</td>
          <td>${yFreq.cumulativeRelFreq[i]}%</td>
        </tr>
      `).join('');

      // 히스토그램과 누적분포 시각화
      showFrequencyPlot(xLabel, yLabel, xFreq, yFreq);
    }

    function calculateFrequencyTable(data) {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      const binCount = Math.ceil(Math.sqrt(data.length)); // Sturges' formula
      const binWidth = range / binCount;
      
      const intervals = [];
      const frequencies = new Array(binCount).fill(0);
      
      // 구간 설정
      for (let i = 0; i < binCount; i++) {
        const start = min + (i * binWidth);
        const end = start + binWidth;
        intervals.push(`${start.toFixed(1)} - ${end.toFixed(1)}`);
      }
      
      // 도수 계산
      data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
        frequencies[binIndex]++;
      });
      
      // 상대도수와 누적도수 계산
      const relativeFreq = frequencies.map(f => ((f / data.length) * 100).toFixed(1));
      const cumulativeFreq = frequencies.reduce((acc, f) => {
        acc.push((acc.length ? acc[acc.length - 1] : 0) + f);
        return acc;
      }, []);
      const cumulativeRelFreq = cumulativeFreq.map(f => ((f / data.length) * 100).toFixed(1));
      
      return {
        intervals,
        frequencies,
        relativeFreq,
        cumulativeFreq,
        cumulativeRelFreq
      };
    }

    function showFrequencyPlot(xLabel, yLabel, xFreq, yFreq) {
      const trace1 = {
        x: xFreq.intervals,
        y: xFreq.frequencies,
        type: 'bar',
        name: `${xLabel} 도수`,
        opacity: 0.7
      };

      const trace2 = {
        x: xFreq.intervals,
        y: xFreq.cumulativeFreq,
        type: 'scatter',
        mode: 'lines+markers',
        name: `${xLabel} 누적도수`,
        yaxis: 'y2'
      };

      const layout = {
        title: '도수분포 및 누적분포',
        barmode: 'overlay',
        xaxis: { title: '구간' },
        yaxis: { title: '도수' },
        yaxis2: {
          title: '누적도수',
          overlaying: 'y',
          side: 'right'
        }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    // QQ플롯 시각화
    function showQQPlot(xLabel, yLabel, xData, yData) {
      const xSorted = [...xData].sort((a, b) => a - b);
      const ySorted = [...yData].sort((a, b) => a - b);
      const n = xSorted.length;
      
      const theoreticalQuantiles = xSorted.map((_, i) => 
        ss.probit((i + 0.5) / n)
      );

      const trace1 = {
        x: theoreticalQuantiles,
        y: xSorted,
        mode: 'markers',
        name: xLabel,
        type: 'scatter'
      };

      const trace2 = {
        x: theoreticalQuantiles,
        y: ySorted,
        mode: 'markers',
        name: yLabel,
        type: 'scatter'
      };

      const layout = {
        title: 'Q-Q Plot (정규성 검정)',
        xaxis: { title: '이론적 분위수' },
        yaxis: { title: '관측된 분위수' }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    // 시각화 함수들
    function showHistogram(xLabel, yLabel, xData, yData) {
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

      const layout = {
        title: '변수별 분포',
        barmode: 'overlay',
        xaxis: { title: '값' },
        yaxis: { title: '빈도' }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    function showBoxPlot(xLabel, yLabel, xData, yData) {
      const trace1 = {
        y: xData,
        type: 'box',
        name: xLabel
      };

      const trace2 = {
        y: yData,
        type: 'box',
        name: yLabel
      };

      const layout = {
        title: '박스플롯',
        yaxis: { title: '값' }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    // 상관분석 함수
    function showPearsonCorrelation(xLabel, yLabel, xData, yData) {
      const correlation = ss.sampleCorrelation(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>분석 유형</th>
          <th>변수 X</th>
          <th>변수 Y</th>
          <th>상관계수</th>
          <th>해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>피어슨 상관분석</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${correlation.toFixed(3)}</td>
          <td>${interpretCorrelation(correlation)}</td>
        </tr>
      `;

      // 산점도 시각화
      showScatterPlot(xLabel, yLabel, xData, yData, correlation);
    }

    function showScatterPlot(xLabel, yLabel, xData, yData, correlation = null) {
      const trace = {
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        name: '데이터 포인트'
      };

      const layout = {
        title: correlation ? 
          `산점도 (상관계수: ${correlation.toFixed(3)})` : 
          '산점도',
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      };

      Plotly.newPlot('plotArea', [trace], layout);
    }

    function interpretCorrelation(correlation) {
      const abs = Math.abs(correlation);
      if (abs >= 0.9) return '매우 강한 상관관계';
      if (abs >= 0.7) return '강한 상관관계';
      if (abs >= 0.5) return '중간 정도의 상관관계';
      if (abs >= 0.3) return '약한 상관관계';
      return '매우 약한 상관관계';
    }

    // 탭 전환
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentView = tab.dataset.view;
        
        if (currentView === 'table') {
          document.getElementById('resultTable').style.display = 'table';
          document.getElementById('plotArea').style.display = 'none';
        } else {
          document.getElementById('resultTable').style.display = 'none';
          document.getElementById('plotArea').style.display = 'block';
        }
      });
    });

    // 샘플 데이터 로드
    document.getElementById('sampleDataBtn').addEventListener('click', () => {
      const sampleData = [
        { height: 170, weight: 65, age: 25 },
        { height: 175, weight: 70, age: 30 },
        { height: 160, weight: 55, age: 28 },
        { height: 180, weight: 80, age: 35 },
        { height: 165, weight: 60, age: 27 }
      ];
      
      uploadedData = sampleData;
      renderPreviewTable(Object.keys(sampleData[0]), sampleData);
      populateVariableSelectors(Object.keys(sampleData[0]));
    });

    // 가설검정 함수들
    function performIndependentTTest(xLabel, yLabel, xData, yData) {
      const { t, pValue } = calculateTTest(xData, yData);
      const cohensD = calculateCohensD(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>검정 유형</th>
          <th>그룹 1</th>
          <th>그룹 2</th>
          <th>t-통계량</th>
          <th>p-값</th>
          <th>효과 크기(Cohen's d)</th>
          <th>결과 해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>독립표본 t-검정</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${t.toFixed(3)}</td>
          <td>${pValue.toFixed(4)}</td>
          <td>${cohensD.toFixed(3)}</td>
          <td>${interpretTTest(pValue, cohensD)}</td>
        </tr>
      `;

      // 박스플롯으로 시각화
      showBoxPlot(xLabel, yLabel, xData, yData);
    }

    function calculateTTest(group1, group2) {
      const n1 = group1.length;
      const n2 = group2.length;
      const mean1 = ss.mean(group1);
      const mean2 = ss.mean(group2);
      const var1 = ss.variance(group1);
      const var2 = ss.variance(group2);
      
      // Welch's t-test
      const t = (mean1 - mean2) / Math.sqrt((var1/n1) + (var2/n2));
      const df = Math.floor(Math.pow((var1/n1 + var2/n2), 2) / 
                 (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1)));
      
      // p-value 계산 (양측검정)
      const pValue = 2 * (1 - ss.tDistribution.cdf(Math.abs(t), df));
      
      return { t, pValue };
    }

    function calculateCohensD(group1, group2) {
      const mean1 = ss.mean(group1);
      const mean2 = ss.mean(group2);
      const pooledStd = Math.sqrt(
        ((group1.length - 1) * ss.variance(group1) + 
         (group2.length - 1) * ss.variance(group2)) / 
        (group1.length + group2.length - 2)
      );
      
      return Math.abs(mean1 - mean2) / pooledStd;
    }

    function interpretTTest(pValue, effectSize) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성 (p < 0.001)';
      else if (pValue < 0.01) significance = '강한 통계적 유의성 (p < 0.01)';
      else if (pValue < 0.05) significance = '통계적으로 유의함 (p < 0.05)';
      else significance = '통계적으로 유의하지 않음 (p ≥ 0.05)';
      
      let effect = '';
      if (effectSize >= 0.8) effect = '큰 효과 크기';
      else if (effectSize >= 0.5) effect = '중간 효과 크기';
      else effect = '작은 효과 크기';
      
      return `${significance}, ${effect}`;
    }

    // 회귀분석 함수들
    function performSimpleRegression(xLabel, yLabel, xData, yData) {
      const regression = calculateRegression(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>분석 유형</th>
          <th>독립변수</th>
          <th>종속변수</th>
          <th>절편(β₀)</th>
          <th>기울기(β₁)</th>
          <th>R²</th>
          <th>p-값</th>
          <th>해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>단순선형회귀</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${regression.intercept.toFixed(3)}</td>
          <td>${regression.slope.toFixed(3)}</td>
          <td>${regression.r2.toFixed(3)}</td>
          <td>${regression.pValue.toFixed(4)}</td>
          <td>${interpretRegression(regression)}</td>
        </tr>
      `;

      // 회귀선이 포함된 산점도 시각화
      showRegressionPlot(xLabel, yLabel, xData, yData, regression);
    }

    function calculateRegression(x, y) {
      const n = x.length;
      const sumX = ss.sum(x);
      const sumY = ss.sum(y);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // R² 계산
      const yPred = x.map(xi => slope * xi + intercept);
      const yMean = ss.mean(y);
      const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - yPred[i], 2), 0);
      const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
      const r2 = 1 - (ssRes / ssTot);
      
      // F-통계량과 p-값 계산
      const dfReg = 1;
      const dfRes = n - 2;
      const msReg = (ssTot - ssRes) / dfReg;
      const msRes = ssRes / dfRes;
      const fStat = msReg / msRes;
      const pValue = 1 - ss.fDistribution.cdf(fStat, dfReg, dfRes);
      
      return { slope, intercept, r2, pValue };
    }

    function showRegressionPlot(xLabel, yLabel, xData, yData, regression) {
      const trace1 = {
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        name: '데이터 포인트'
      };

      // 회귀선 생성
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

      const layout = {
        title: `단순선형회귀 (R² = ${regression.r2.toFixed(3)})`,
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    function interpretRegression(regression) {
      let significance = '';
      if (regression.pValue < 0.001) significance = '매우 강한 통계적 유의성';
      else if (regression.pValue < 0.01) significance = '강한 통계적 유의성';
      else if (regression.pValue < 0.05) significance = '통계적으로 유의함';
      else significance = '통계적으로 유의하지 않음';
      
      let fit = '';
      if (regression.r2 >= 0.7) fit = '강한 설명력';
      else if (regression.r2 >= 0.5) fit = '중간 정도의 설명력';
      else fit = '약한 설명력';
      
      return `${significance}, ${fit} (R² = ${regression.r2.toFixed(3)})`;
    }

    // 비모수 검정 함수들
    function performMannWhitneyTest(xLabel, yLabel, xData, yData) {
      const { u, pValue } = calculateMannWhitneyTest(xData, yData);
      const effectSize = calculateEffectSize(u, xData.length, yData.length);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>검정 유형</th>
          <th>그룹 1</th>
          <th>그룹 2</th>
          <th>U 통계량</th>
          <th>p-값</th>
          <th>효과 크기(r)</th>
          <th>결과 해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>맨휘트니 U 검정</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${u.toFixed(3)}</td>
          <td>${pValue.toFixed(4)}</td>
          <td>${effectSize.toFixed(3)}</td>
          <td>${interpretMannWhitney(pValue, effectSize)}</td>
        </tr>
      `;

      // 박스플롯으로 시각화
      showBoxPlot(xLabel, yLabel, xData, yData);
    }

    function calculateMannWhitneyTest(group1, group2) {
      const n1 = group1.length;
      const n2 = group2.length;
      
      // 순위 계산
      const allData = [...group1, ...group2];
      const ranks = calculateRanks(allData);
      
      // 각 그룹의 순위 합 계산
      const r1 = ranks.slice(0, n1).reduce((a, b) => a + b, 0);
      const r2 = ranks.slice(n1).reduce((a, b) => a + b, 0);
      
      // U 통계량 계산
      const u1 = r1 - (n1 * (n1 + 1)) / 2;
      const u2 = r2 - (n2 * (n2 + 1)) / 2;
      const u = Math.min(u1, u2);
      
      // p-값 계산 (근사적 정규분포 사용)
      const mu = (n1 * n2) / 2;
      const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
      const z = (u - mu) / sigma;
      const pValue = 2 * (1 - ss.standardNormal.cdf(Math.abs(z)));
      
      return { u, pValue };
    }

    function calculateEffectSize(u, n1, n2) {
      return Math.abs(u - (n1 * n2) / 2) / Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
    }

    function interpretMannWhitney(pValue, effectSize) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성 (p < 0.001)';
      else if (pValue < 0.01) significance = '강한 통계적 유의성 (p < 0.01)';
      else if (pValue < 0.05) significance = '통계적으로 유의함 (p < 0.05)';
      else significance = '통계적으로 유의하지 않음 (p ≥ 0.05)';
      
      let effect = '';
      if (effectSize >= 0.5) effect = '큰 효과 크기';
      else if (effectSize >= 0.3) effect = '중간 효과 크기';
      else effect = '작은 효과 크기';
      
      return `${significance}, ${effect}`;
    }

    // ANOVA 함수들
    function performOneWayANOVA(xLabel, yLabel, xData, yData) {
      const { f, pValue, etaSquared } = calculateOneWayANOVA(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>검정 유형</th>
          <th>그룹 변수</th>
          <th>종속 변수</th>
          <th>F 통계량</th>
          <th>p-값</th>
          <th>η² (에타제곱)</th>
          <th>결과 해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>일원분산분석</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${f.toFixed(3)}</td>
          <td>${pValue.toFixed(4)}</td>
          <td>${etaSquared.toFixed(3)}</td>
          <td>${interpretANOVA(pValue, etaSquared)}</td>
        </tr>
      `;

      // 박스플롯으로 시각화
      showBoxPlot(xLabel, yLabel, xData, yData);
    }

    function calculateOneWayANOVA(group1, group2) {
      const n1 = group1.length;
      const n2 = group2.length;
      const n = n1 + n2;
      
      // 전체 평균
      const grandMean = ss.mean([...group1, ...group2]);
      
      // 그룹 평균
      const mean1 = ss.mean(group1);
      const mean2 = ss.mean(group2);
      
      // 제곱합 계산
      const ssBetween = n1 * Math.pow(mean1 - grandMean, 2) + 
                       n2 * Math.pow(mean2 - grandMean, 2);
      const ssWithin = group1.reduce((acc, x) => acc + Math.pow(x - mean1, 2), 0) +
                      group2.reduce((acc, x) => acc + Math.pow(x - mean2, 2), 0);
      const ssTotal = ssBetween + ssWithin;
      
      // 자유도 계산
      const dfBetween = 1; // 2개 그룹이므로
      const dfWithin = n - 2;
      
      // 평균제곱 계산
      const msBetween = ssBetween / dfBetween;
      const msWithin = ssWithin / dfWithin;
      
      // F 통계량과 p-값 계산
      const f = msBetween / msWithin;
      const pValue = 1 - ss.fDistribution.cdf(f, dfBetween, dfWithin);
      
      // 에타제곱 계산
      const etaSquared = ssBetween / ssTotal;
      
      return { f, pValue, etaSquared };
    }

    function interpretANOVA(pValue, etaSquared) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성 (p < 0.001)';
      else if (pValue < 0.01) significance = '강한 통계적 유의성 (p < 0.01)';
      else if (pValue < 0.05) significance = '통계적으로 유의함 (p < 0.05)';
      else significance = '통계적으로 유의하지 않음 (p ≥ 0.05)';
      
      let effect = '';
      if (etaSquared >= 0.14) effect = '큰 효과 크기';
      else if (etaSquared >= 0.06) effect = '중간 효과 크기';
      else effect = '작은 효과 크기';
      
      return `${significance}, ${effect}`;
    }

    // 순위 계산 헬퍼 함수
    function calculateRanks(data) {
      const sorted = [...data].sort((a, b) => a - b);
      const ranks = new Array(data.length);
      
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        const rank = sorted.indexOf(value) + 1;
        
        // 동점 처리
        let ties = 0;
        for (let j = 0; j < i; j++) {
          if (data[j] === value) ties++;
        }
        
        ranks[i] = rank + ties;
      }
      
      return ranks;
    }

    // 카이제곱 검정 함수들
    function performChiSquareTest(xLabel, yLabel, xData, yData) {
      const { chiSquare, pValue, cramerV } = calculateChiSquareTest(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>검정 유형</th>
          <th>변수 X</th>
          <th>변수 Y</th>
          <th>χ² 통계량</th>
          <th>p-값</th>
          <th>Cramer's V</th>
          <th>결과 해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>카이제곱 검정</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${chiSquare.toFixed(3)}</td>
          <td>${pValue.toFixed(4)}</td>
          <td>${cramerV.toFixed(3)}</td>
          <td>${interpretChiSquare(pValue, cramerV)}</td>
        </tr>
      `;

      // 막대 그래프로 시각화
      showChiSquarePlot(xLabel, yLabel, xData, yData);
    }

    function calculateChiSquareTest(xData, yData) {
      // 데이터를 범주화
      const xCategories = [...new Set(xData)];
      const yCategories = [...new Set(yData)];
      
      // 교차표 생성
      const contingencyTable = Array(xCategories.length).fill().map(() => 
        Array(yCategories.length).fill(0)
      );
      
      // 빈도 계산
      xData.forEach((x, i) => {
        const xIndex = xCategories.indexOf(x);
        const yIndex = yCategories.indexOf(yData[i]);
        contingencyTable[xIndex][yIndex]++;
      });
      
      // 기대빈도 계산
      const rowSums = contingencyTable.map(row => row.reduce((a, b) => a + b, 0));
      const colSums = contingencyTable[0].map((_, i) => 
        contingencyTable.reduce((a, row) => a + row[i], 0)
      );
      const total = rowSums.reduce((a, b) => a + b, 0);
      
      const expected = contingencyTable.map((row, i) => 
        row.map((_, j) => (rowSums[i] * colSums[j]) / total)
      );
      
      // 카이제곱 통계량 계산
      const chiSquare = contingencyTable.reduce((acc, row, i) => 
        acc + row.reduce((sum, cell, j) => 
          sum + Math.pow(cell - expected[i][j], 2) / expected[i][j], 0
        ), 0
      );
      
      // 자유도 계산
      const df = (xCategories.length - 1) * (yCategories.length - 1);
      
      // p-값 계산
      const pValue = 1 - ss.chiSquaredGoodnessOfFit.cdf(chiSquare, df);
      
      // Cramer's V 계산
      const cramerV = Math.sqrt(chiSquare / (total * (Math.min(xCategories.length, yCategories.length) - 1)));
      
      return { chiSquare, pValue, cramerV, contingencyTable, xCategories, yCategories };
    }

    function showChiSquarePlot(xLabel, yLabel, xData, yData) {
      const { contingencyTable, xCategories, yCategories } = calculateChiSquareTest(xData, yData);
      
      const traces = xCategories.map((x, i) => ({
        x: yCategories,
        y: contingencyTable[i],
        type: 'bar',
        name: x
      }));

      const layout = {
        title: '교차분포',
        barmode: 'group',
        xaxis: { title: yLabel },
        yaxis: { title: '빈도' }
      };

      Plotly.newPlot('plotArea', traces, layout);
    }

    function interpretChiSquare(pValue, cramerV) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성 (p < 0.001)';
      else if (pValue < 0.01) significance = '강한 통계적 유의성 (p < 0.01)';
      else if (pValue < 0.05) significance = '통계적으로 유의함 (p < 0.05)';
      else significance = '통계적으로 유의하지 않음 (p ≥ 0.05)';
      
      let effect = '';
      if (cramerV >= 0.5) effect = '강한 연관성';
      else if (cramerV >= 0.3) effect = '중간 정도의 연관성';
      else effect = '약한 연관성';
      
      return `${significance}, ${effect}`;
    }

    // 로지스틱 회귀 분석 함수들
    function performLogisticRegression(xLabel, yLabel, xData, yData) {
      const { coefficients, oddsRatios, pValues, pseudoR2 } = calculateLogisticRegression(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>분석 유형</th>
          <th>변수</th>
          <th>회귀계수</th>
          <th>오즈비</th>
          <th>p-값</th>
          <th>해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td rowspan="2">로지스틱 회귀</td>
          <td>절편</td>
          <td>${coefficients[0].toFixed(3)}</td>
          <td>-</td>
          <td>${pValues[0].toFixed(4)}</td>
          <td>${interpretLogisticCoefficient(coefficients[0], pValues[0])}</td>
        </tr>
        <tr>
          <td>${xLabel}</td>
          <td>${coefficients[1].toFixed(3)}</td>
          <td>${oddsRatios[1].toFixed(3)}</td>
          <td>${pValues[1].toFixed(4)}</td>
          <td>${interpretLogisticCoefficient(coefficients[1], pValues[1])}</td>
        </tr>
      `;

      // 로지스틱 회귀선이 포함된 산점도 시각화
      showLogisticRegressionPlot(xLabel, yLabel, xData, yData, coefficients);
    }

    function calculateLogisticRegression(x, y) {
      // 최대우도 추정을 위한 반복적 재가중 최소제곱법
      let beta = [0, 0]; // 초기값
      const maxIter = 100;
      const tolerance = 1e-6;
      
      for (let iter = 0; iter < maxIter; iter++) {
        // 예측 확률 계산
        const p = x.map(xi => 1 / (1 + Math.exp(-(beta[0] + beta[1] * xi))));
        
        // 가중치와 작업변수 계산
        const w = p.map(pi => pi * (1 - pi));
        const z = x.map((xi, i) => beta[0] + beta[1] * xi + (y[i] - p[i]) / w[i]);
        
        // 가중 최소제곱 추정
        const xMatrix = x.map(xi => [1, xi]);
        const wMatrix = w.map(wi => [wi, 0, 0, wi]);
        
        const newBeta = solveWeightedLeastSquares(xMatrix, wMatrix, z);
        
        // 수렴 확인
        if (Math.abs(newBeta[0] - beta[0]) < tolerance && 
            Math.abs(newBeta[1] - beta[1]) < tolerance) {
          beta = newBeta;
          break;
        }
        
        beta = newBeta;
      }
      
      // 오즈비 계산
      const oddsRatios = [Math.exp(beta[0]), Math.exp(beta[1])];
      
      // p-값 계산 (Wald 검정)
      const pValues = calculateWaldTest(x, y, beta);
      
      // 의사 R² 계산 (McFadden's R²)
      const pseudoR2 = calculatePseudoR2(x, y, beta);
      
      return { coefficients: beta, oddsRatios, pValues, pseudoR2 };
    }

    function solveWeightedLeastSquares(xMatrix, wMatrix, z) {
      // 가중 최소제곱 추정 구현
      // 실제 구현에서는 수치적 방법을 사용해야 함
      return [0, 0]; // 임시 반환값
    }

    function calculateWaldTest(x, y, beta) {
      // Wald 검정 통계량 계산
      // 실제 구현에서는 표준오차 계산이 필요
      return [0.05, 0.05]; // 임시 반환값
    }

    function calculatePseudoR2(x, y, beta) {
      // McFadden's R² 계산
      // 실제 구현에서는 로그우도 계산이 필요
      return 0.5; // 임시 반환값
    }

    function showLogisticRegressionPlot(xLabel, yLabel, xData, yData, coefficients) {
      const trace1 = {
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        name: '데이터 포인트'
      };

      // 로지스틱 회귀선 생성
      const xRange = [Math.min(...xData), Math.max(...xData)];
      const yPred = xRange.map(x => 
        1 / (1 + Math.exp(-(coefficients[0] + coefficients[1] * x)))
      );
      
      const trace2 = {
        x: xRange,
        y: yPred,
        mode: 'lines',
        type: 'scatter',
        name: '로지스틱 회귀선',
        line: { color: 'red' }
      };

      const layout = {
        title: '로지스틱 회귀 분석',
        xaxis: { title: xLabel },
        yaxis: { title: '확률' }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    function interpretLogisticCoefficient(coef, pValue) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성';
      else if (pValue < 0.01) significance = '강한 통계적 유의성';
      else if (pValue < 0.05) significance = '통계적으로 유의함';
      else significance = '통계적으로 유의하지 않음';
      
      let direction = coef > 0 ? '양의' : '음의';
      let effect = Math.abs(coef) >= 1 ? '강한' : Math.abs(coef) >= 0.5 ? '중간 정도의' : '약한';
      
      return `${significance}, ${direction} ${effect} 효과`;
    }

    // 스피어만 상관 분석 함수들
    function showSpearmanCorrelation(xLabel, yLabel, xData, yData) {
      const { correlation, pValue } = calculateSpearmanCorrelation(xData, yData);
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>분석 유형</th>
          <th>변수 X</th>
          <th>변수 Y</th>
          <th>상관계수</th>
          <th>p-값</th>
          <th>해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td>스피어만 상관분석</td>
          <td>${xLabel}</td>
          <td>${yLabel}</td>
          <td>${correlation.toFixed(3)}</td>
          <td>${pValue.toFixed(4)}</td>
          <td>${interpretSpearmanCorrelation(correlation, pValue)}</td>
        </tr>
      `;

      // 산점도 시각화
      showScatterPlot(xLabel, yLabel, xData, yData, correlation);
    }

    function calculateSpearmanCorrelation(x, y) {
      // 순위 계산
      const xRanks = calculateRanks(x);
      const yRanks = calculateRanks(y);
      
      // 순위 차이의 제곱 합 계산
      const dSquared = xRanks.reduce((sum, rank, i) => 
        sum + Math.pow(rank - yRanks[i], 2), 0
      );
      
      const n = x.length;
      const correlation = 1 - (6 * dSquared) / (n * (n * n - 1));
      
      // p-값 계산 (근사적 정규분포 사용)
      const z = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
      const pValue = 2 * (1 - ss.standardNormal.cdf(Math.abs(z)));
      
      return { correlation, pValue };
    }

    function interpretSpearmanCorrelation(correlation, pValue) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성 (p < 0.001)';
      else if (pValue < 0.01) significance = '강한 통계적 유의성 (p < 0.01)';
      else if (pValue < 0.05) significance = '통계적으로 유의함 (p < 0.05)';
      else significance = '통계적으로 유의하지 않음 (p ≥ 0.05)';
      
      const abs = Math.abs(correlation);
      let strength = '';
      if (abs >= 0.9) strength = '매우 강한';
      else if (abs >= 0.7) strength = '강한';
      else if (abs >= 0.5) strength = '중간 정도의';
      else if (abs >= 0.3) strength = '약한';
      else strength = '매우 약한';
      
      let direction = correlation > 0 ? '양의' : '음의';
      
      return `${significance}, ${direction} ${strength} 상관관계`;
    }

    // 다중 회귀 분석 함수들
    function performMultipleRegression(xLabel, yLabel, xData, yData) {
      const additionalVars = Array.from(document.getElementById('additional-vars').selectedOptions)
        .map(option => option.value);
      
      if (additionalVars.length === 0) {
        alert('추가 변수를 선택해주세요.');
        return;
      }

      const { coefficients, r2, pValues, fStat, fPValue } = calculateMultipleRegression(
        xData, yData, additionalVars
      );
      
      const thead = document.querySelector('#resultTable thead');
      const tbody = document.querySelector('#resultTable tbody');
      
      thead.innerHTML = `
        <tr>
          <th>분석 유형</th>
          <th>변수</th>
          <th>회귀계수</th>
          <th>표준화 계수</th>
          <th>p-값</th>
          <th>해석</th>
        </tr>
      `;
      
      tbody.innerHTML = `
        <tr>
          <td rowspan="${coefficients.length}">다중 회귀</td>
          <td>절편</td>
          <td>${coefficients[0].toFixed(3)}</td>
          <td>-</td>
          <td>${pValues[0].toFixed(4)}</td>
          <td>${interpretMultipleRegression(coefficients[0], pValues[0])}</td>
        </tr>
        ${coefficients.slice(1).map((coef, i) => `
          <tr>
            <td>${i === 0 ? xLabel : additionalVars[i-1]}</td>
            <td>${coef.toFixed(3)}</td>
            <td>${(coef * Math.sqrt(ss.variance(xData)) / Math.sqrt(ss.variance(yData))).toFixed(3)}</td>
            <td>${pValues[i+1].toFixed(4)}</td>
            <td>${interpretMultipleRegression(coef, pValues[i+1])}</td>
          </tr>
        `).join('')}
      `;

      // 모델 적합도 정보 추가
      const modelInfo = document.createElement('div');
      modelInfo.innerHTML = `
        <p>모델 적합도: R² = ${r2.toFixed(3)}</p>
        <p>F 통계량 = ${fStat.toFixed(3)}, p-값 = ${fPValue.toFixed(4)}</p>
      `;
      document.getElementById('resultArea').insertBefore(modelInfo, document.getElementById('resultTable'));

      // 회귀선이 포함된 산점도 시각화
      showMultipleRegressionPlot(xLabel, yLabel, xData, yData, coefficients, additionalVars);
    }

    function calculateMultipleRegression(x, y, additionalVars) {
      const n = x.length;
      const k = additionalVars.length + 1; // 독립변수 개수
      
      // 데이터 행렬 구성
      const X = x.map((xi, i) => {
        const row = [1, xi];
        additionalVars.forEach(varName => {
          row.push(parseFloat(uploadedData[i][varName]));
        });
        return row;
      });
      
      // 최소제곱 추정
      const Xt = transposeMatrix(X);
      const XtX = matrixMultiply(Xt, X);
      const XtXInv = matrixInverse(XtX);
      const Xty = matrixMultiply(Xt, y);
      const coefficients = matrixMultiply(XtXInv, Xty);
      
      // R² 계산
      const yPred = X.map(row => 
        row.reduce((sum, xi, i) => sum + xi * coefficients[i], 0)
      );
      const yMean = ss.mean(y);
      const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - yPred[i], 2), 0);
      const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
      const r2 = 1 - (ssRes / ssTot);
      
      // F 통계량과 p-값 계산
      const dfReg = k - 1;
      const dfRes = n - k;
      const msReg = (ssTot - ssRes) / dfReg;
      const msRes = ssRes / dfRes;
      const fStat = msReg / msRes;
      const fPValue = 1 - ss.fDistribution.cdf(fStat, dfReg, dfRes);
      
      // 각 계수의 p-값 계산
      const pValues = coefficients.map((coef, i) => {
        const se = Math.sqrt(msRes * XtXInv[i][i]);
        const t = coef / se;
        return 2 * (1 - ss.tDistribution.cdf(Math.abs(t), dfRes));
      });
      
      return { coefficients, r2, pValues, fStat, fPValue };
    }

    function showMultipleRegressionPlot(xLabel, yLabel, xData, yData, coefficients, additionalVars) {
      const trace1 = {
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        name: '데이터 포인트'
      };

      // 예측값 계산
      const xRange = [Math.min(...xData), Math.max(...xData)];
      const yPred = xRange.map(x => {
        const row = [1, x];
        additionalVars.forEach(varName => {
          row.push(ss.mean(uploadedData.map(row => parseFloat(row[varName]))));
        });
        return row.reduce((sum, xi, i) => sum + xi * coefficients[i], 0);
      });
      
      const trace2 = {
        x: xRange,
        y: yPred,
        mode: 'lines',
        type: 'scatter',
        name: '회귀선',
        line: { color: 'red' }
      };

      const layout = {
        title: `다중 회귀 분석 (R² = ${coefficients.r2.toFixed(3)})`,
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      };

      Plotly.newPlot('plotArea', [trace1, trace2], layout);
    }

    function interpretMultipleRegression(coef, pValue) {
      let significance = '';
      if (pValue < 0.001) significance = '매우 강한 통계적 유의성';
      else if (pValue < 0.01) significance = '강한 통계적 유의성';
      else if (pValue < 0.05) significance = '통계적으로 유의함';
      else significance = '통계적으로 유의하지 않음';
      
      let direction = coef > 0 ? '양의' : '음의';
      let effect = Math.abs(coef) >= 1 ? '강한' : Math.abs(coef) >= 0.5 ? '중간 정도의' : '약한';
      
      return `${significance}, ${direction} ${effect} 효과`;
    }

    // 행렬 연산 헬퍼 함수들
    function transposeMatrix(matrix) {
      return matrix[0].map((_, i) => matrix.map(row => row[i]));
    }

    function matrixMultiply(a, b) {
      if (typeof b[0] === 'number') {
        return a.map(row => row.reduce((sum, ai, i) => sum + ai * b[i], 0));
      }
      return a.map(row => 
        b[0].map((_, j) => row.reduce((sum, ai, i) => sum + ai * b[i][j], 0))
      );
    }

    function matrixInverse(matrix) {
      // 가우스-조르단 소거법을 사용한 역행렬 계산
      const n = matrix.length;
      const augmented = matrix.map((row, i) => {
        const identity = new Array(n).fill(0);
        identity[i] = 1;
        return [...row, ...identity];
      });
      
      // 전진 소거
      for (let i = 0; i < n; i++) {
        const pivot = augmented[i][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[i][j] /= pivot;
        }
        
        for (let k = 0; k < n; k++) {
          if (k !== i) {
            const factor = augmented[k][i];
            for (let j = 0; j < 2 * n; j++) {
              augmented[k][j] -= factor * augmented[i][j];
            }
          }
        }
      }
      
      // 역행렬 부분 추출
      return augmented.map(row => row.slice(n));
    }

    // 히트맵 함수들
    function showHeatmap(xLabel, yLabel, xData, yData) {
      const { matrix, xLabels, yLabels } = calculateHeatmapMatrix(xData, yData);
      
      const trace = {
        z: matrix,
        x: xLabels,
        y: yLabels,
        type: 'heatmap',
        colorscale: 'Viridis',
        colorbar: {
          title: '빈도'
        }
      };

      const layout = {
        title: '히트맵',
        xaxis: { title: xLabel },
        yaxis: { title: yLabel }
      };

      Plotly.newPlot('plotArea', [trace], layout);
    }

    function calculateHeatmapMatrix(x, y) {
      // 구간 설정 (스터지스 규칙 사용)
      const xBins = Math.ceil(Math.log2(x.length) + 1);
      const yBins = Math.ceil(Math.log2(y.length) + 1);
      
      // 구간 경계 계산
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const yMin = Math.min(...y);
      const yMax = Math.max(...y);
      
      const xStep = (xMax - xMin) / xBins;
      const yStep = (yMax - yMin) / yBins;
      
      // 빈도 행렬 초기화
      const matrix = Array(yBins).fill().map(() => Array(xBins).fill(0));
      
      // 데이터 포인트 분류
      x.forEach((xi, i) => {
        const xIndex = Math.min(Math.floor((xi - xMin) / xStep), xBins - 1);
        const yIndex = Math.min(Math.floor((y[i] - yMin) / yStep), yBins - 1);
        matrix[yIndex][xIndex]++;
      });
      
      // 레이블 생성
      const xLabels = Array(xBins).fill().map((_, i) => 
        `${(xMin + i * xStep).toFixed(1)}-${(xMin + (i + 1) * xStep).toFixed(1)}`
      );
      const yLabels = Array(yBins).fill().map((_, i) => 
        `${(yMin + i * yStep).toFixed(1)}-${(yMin + (i + 1) * yStep).toFixed(1)}`
      );
      
      return { matrix, xLabels, yLabels };
    }

    // 시계열 그래프 함수들
    function showTimeSeries(xLabel, yLabel, xData, yData) {
      // 날짜 형식 변환
      const dates = xData.map(dateStr => new Date(dateStr));
      
      const trace = {
        x: dates,
        y: yData,
        type: 'scatter',
        mode: 'lines+markers',
        name: yLabel
      };

      const layout = {
        title: '시계열 그래프',
        xaxis: { 
          title: xLabel,
          type: 'date',
          tickformat: '%Y-%m-%d'
        },
        yaxis: { title: yLabel },
        hovermode: 'x unified'
      };

      Plotly.newPlot('plotArea', [trace], layout);
    }

    function showTimeSeriesWithTrend(xLabel, yLabel, xData, yData) {
      const dates = xData.map(dateStr => new Date(dateStr));
      
      // 추세선 계산
      const { slope, intercept } = calculateTrendLine(dates, yData);
      const trendLine = dates.map(date => 
        slope * (date - dates[0]) / (24 * 60 * 60 * 1000) + intercept
      );
      
      const traces = [
        {
          x: dates,
          y: yData,
          type: 'scatter',
          mode: 'lines+markers',
          name: '실제 데이터'
        },
        {
          x: dates,
          y: trendLine,
          type: 'scatter',
          mode: 'lines',
          name: '추세선',
          line: { color: 'red', dash: 'dash' }
        }
      ];

      const layout = {
        title: '시계열 그래프 (추세선 포함)',
        xaxis: { 
          title: xLabel,
          type: 'date',
          tickformat: '%Y-%m-%d'
        },
        yaxis: { title: yLabel },
        hovermode: 'x unified'
      };

      Plotly.newPlot('plotArea', traces, layout);
    }

    function calculateTrendLine(x, y) {
      const n = x.length;
      const xMean = x.reduce((sum, xi) => sum + xi, 0) / n;
      const yMean = y.reduce((sum, yi) => sum + yi, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        const xDiff = x[i] - xMean;
        numerator += xDiff * (y[i] - yMean);
        denominator += xDiff * xDiff;
      }
      
      const slope = numerator / denominator;
      const intercept = yMean - slope * xMean;
      
      return { slope, intercept };
    }

    // 분석 함수에 새로운 시각화 옵션 추가
    function performAnalysis() {
      const analysisType = document.getElementById('analysis-type').value;
      const xVar = document.getElementById('x-var').value;
      const yVar = document.getElementById('y-var').value;
      
      if (!xVar || !yVar) {
        alert('변수를 선택해주세요.');
        return;
      }
      
      const xData = uploadedData.map(row => parseFloat(row[xVar]));
      const yData = uploadedData.map(row => parseFloat(row[yVar]));
      
      switch(analysisType) {
        // ... existing cases ...
        
        case 'heatmap':
          showHeatmap(xVar, yVar, xData, yData);
          break;
          
        case 'time-series':
          showTimeSeries(xVar, yVar, xData, yData);
          break;
          
        case 'time-series-trend':
          showTimeSeriesWithTrend(xVar, yVar, xData, yData);
          break;
      }
    }

    // HTML에 필요한 스크립트 추가
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
  </script>
</body>
</html>

