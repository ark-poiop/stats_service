// 통계 분석 기능 모듈
const Statistics = {
  // 기술통계 분석
  Descriptive: {
    // 기본 기술통계 계산
    calculate(data) {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('유효한 데이터가 필요합니다.');
      }

      const numericData = data.filter(x => !isNaN(parseFloat(x))).map(x => parseFloat(x));
      
      if (numericData.length === 0) {
        throw new Error('수치형 데이터가 없습니다.');
      }

      return {
        count: numericData.length,
        mean: ss.mean(numericData),
        median: ss.median(numericData),
        mode: ss.mode(numericData),
        std: ss.standardDeviation(numericData),
        variance: ss.variance(numericData),
        min: Math.min(...numericData),
        max: Math.max(...numericData),
        range: Math.max(...numericData) - Math.min(...numericData),
        q1: ss.quantile(numericData, 0.25),
        q2: ss.quantile(numericData, 0.50),
        q3: ss.quantile(numericData, 0.75),
        iqr: ss.quantile(numericData, 0.75) - ss.quantile(numericData, 0.25),
        skewness: ss.sampleSkewness(numericData),
        kurtosis: ss.sampleKurtosis(numericData),
        cv: (ss.standardDeviation(numericData) / ss.mean(numericData)) * 100
      };
    },

    // 산포도 분석
    dispersion(data) {
      const stats = this.calculate(data);
      return {
        std: stats.std,
        variance: stats.variance,
        range: stats.range,
        iqr: stats.iqr,
        cv: stats.cv,
        interpretation: this.interpretDispersion(stats)
      };
    },

    // 분포 분석
    distribution(data) {
      const stats = this.calculate(data);
      return {
        q1: stats.q1,
        q2: stats.q2,
        q3: stats.q3,
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
        normality: this.testNormality(data),
        interpretation: this.interpretDistribution(stats)
      };
    },

    // 도수분포표 생성
    frequency(data, bins = 10) {
      const numericData = data.filter(x => !isNaN(parseFloat(x))).map(x => parseFloat(x));
      const min = Math.min(...numericData);
      const max = Math.max(...numericData);
      const binWidth = (max - min) / bins;
      
      const frequencies = new Array(bins).fill(0);
      const binRanges = [];
      
      // 구간 범위 계산
      for (let i = 0; i < bins; i++) {
        const start = min + (i * binWidth);
        const end = start + binWidth;
        binRanges.push([start, end]);
      }
      
      // 빈도수 계산
      numericData.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
        frequencies[binIndex]++;
      });
      
      // 상대도수와 누적도수 계산
      const total = numericData.length;
      let cumulative = 0;
      
      return binRanges.map((range, i) => {
        const frequency = frequencies[i];
        const relativeFreq = frequency / total;
        cumulative += frequency;
        
        return {
          range: {
            start: range[0],
            end: range[1],
            label: `${range[0].toFixed(2)} - ${range[1].toFixed(2)}`
          },
          frequency,
          relativeFrequency: relativeFreq,
          cumulativeFrequency: cumulative,
          cumulativeRelativeFrequency: cumulative / total
        };
      });
    },

    // 산포도 해석
    interpretDispersion(stats) {
      const cvInterpretation = stats.cv < 15 ? '낮음' :
                              stats.cv < 30 ? '중간' : '높음';
      
      return {
        variability: cvInterpretation,
        summary: `변동계수(CV)는 ${stats.cv.toFixed(2)}%로, 데이터의 상대적 산포도는 ${cvInterpretation}입니다.`
      };
    },

    // 분포 해석
    interpretDistribution(stats) {
      const skewInterpretation = Math.abs(stats.skewness) < 0.5 ? '대칭에 가까움' :
                                Math.abs(stats.skewness) < 1 ? '약간 비대칭' : '심한 비대칭';
      
      const kurtosisInterpretation = Math.abs(stats.kurtosis) < 0.5 ? '정규분포에 가까움' :
                                    Math.abs(stats.kurtosis) < 1 ? '약간 다름' : '매우 다름';
      
      return {
        skewness: skewInterpretation,
        kurtosis: kurtosisInterpretation,
        summary: `분포는 ${skewInterpretation}이며, 첨도는 정규분포와 ${kurtosisInterpretation}입니다.`
      };
    },

    // 정규성 검정
    testNormality(data) {
      const stats = this.calculate(data);
      const skewness = Math.abs(stats.skewness);
      const kurtosis = Math.abs(stats.kurtosis);
      
      let normality = '정규분포에 가까움';
      if (skewness > 1 || kurtosis > 1) {
        normality = '정규분포와 차이 있음';
      } else if (skewness > 0.5 || kurtosis > 0.5) {
        normality = '약간의 차이 있음';
      }
      
      return {
        ...stats,
        normality,
        isNormal: skewness <= 1 && kurtosis <= 1
      };
    }
  },

  // 가설검정
  HypothesisTest: {
    // 독립표본 t-검정
    independentTTest(group1, group2) {
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
      
      const pValue = 2 * (1 - ss.tDistribution.cdf(Math.abs(t), df));
      const cohensD = Math.abs(mean1 - mean2) / Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;
      
      return {
        t,
        df,
        pValue,
        cohensD,
        significant,
        effectSize: this.interpretEffectSize(cohensD),
        mean1,
        mean2,
        var1,
        var2,
        n1,
        n2
      };
    },

    // 대응표본 t-검정
    pairedTTest(before, after) {
      if (before.length !== after.length) {
        throw new Error('대응표본의 크기가 같아야 합니다.');
      }

      const differences = before.map((b, i) => after[i] - b);
      const n = differences.length;
      const meanDiff = ss.mean(differences);
      const stdDiff = ss.standardDeviation(differences);
      const t = meanDiff / (stdDiff / Math.sqrt(n));
      const df = n - 1;
      const pValue = 2 * (1 - ss.tDistribution.cdf(Math.abs(t), df));
      const cohensD = Math.abs(meanDiff) / stdDiff;
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;

      return {
        t,
        df,
        pValue,
        cohensD,
        significant,
        effectSize: this.interpretEffectSize(cohensD),
        meanDiff,
        stdDiff,
        n
      };
    },


// 통계 분석 기능 모듈
const Statistics = {
  // 기술통계 분석
  Descriptive: {
    /**
     * 기본 기술통계 계산
     * @param {Array} data - 분석할 데이터
     * @returns {Object} 기술통계 결과
     */
    calculate(data) {
      Utils.validateInput(data);
      const numericData = Utils.toNumeric(data);
      
      if (numericData.length === 0) {
        throw new Error('수치형 데이터가 없습니다.');
      }

      const mean = MathUtils.mean(numericData);
      const std = MathUtils.standardDeviation(numericData);
      const variance = MathUtils.variance(numericData);
      const min = Math.min(...numericData);
      const max = Math.max(...numericData);

      return {
        count: numericData.length,
        mean,
        median: MathUtils.median(numericData),
        mode: MathUtils.mode(numericData),
        std,
        variance,
        min,
        max,
        range: max - min,
        q1: MathUtils.quantile(numericData, 0.25),
        q2: MathUtils.quantile(numericData, 0.50),
        q3: MathUtils.quantile(numericData, 0.75),
        iqr: MathUtils.quantile(numericData, 0.75) - MathUtils.quantile(numericData, 0.25),
        skewness: MathUtils.skewness(numericData),
        kurtosis: MathUtils.kurtosis(numericData),
        cv: mean !== 0 ? (std / Math.abs(mean)) * 100 : 0
      };
    },

    /**
     * 산포도 분석
     * @param {Array} data - 분석할 데이터
     * @returns {Object} 산포도 분석 결과
     */
    dispersion(data) {
      const stats = this.calculate(data);
      return {
        std: stats.std,
        variance: stats.variance,
        range: stats.range,
        iqr: stats.iqr,
        cv: stats.cv,
        interpretation: this.interpretDispersion(stats)
      };
    },

    /**
     * 분포 분석
     * @param {Array} data - 분석할 데이터
     * @returns {Object} 분포 분석 결과
     */
    distribution(data) {
      const stats = this.calculate(data);
      return {
        q1: stats.q1,
        q2: stats.q2,
        q3: stats.q3,
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
        normality: this.testNormality(data),
        interpretation: this.interpretDistribution(stats)
      };
    },

    /**
     * 도수분포표 생성
     * @param {Array} data - 데이터
     * @param {number} bins - 구간 수
     * @returns {Array} 도수분포표
     */
    frequency(data, bins = CONFIG.STATS.DEFAULT_BINS) {
      const numericData = Utils.toNumeric(data);
      const min = Math.min(...numericData);
      const max = Math.max(...numericData);
      const binWidth = (max - min) / bins;
      
      const frequencies = new Array(bins).fill(0);
      const binRanges = [];
      
      // 구간 범위 계산
      for (let i = 0; i < bins; i++) {
        const start = min + (i * binWidth);
        const end = start + binWidth;
        binRanges.push([start, end]);
      }
      
      // 빈도수 계산
      numericData.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
        frequencies[binIndex]++;
      });
      
      // 상대도수와 누적도수 계산
      const total = numericData.length;
      let cumulative = 0;
      
      return binRanges.map((range, i) => {
        const frequency = frequencies[i];
        const relativeFreq = frequency / total;
        cumulative += frequency;
        
        return {
          range: {
            start: range[0],
            end: range[1],
            label: `${range[0].toFixed(2)} - ${range[1].toFixed(2)}`
          },
          frequency,
          relativeFrequency: relativeFreq,
          cumulativeFrequency: cumulative,
          cumulativeRelativeFrequency: cumulative / total
        };
      });
    },

    /**
     * 산포도 해석
     */
    interpretDispersion(stats) {
      const cvInterpretation = stats.cv < 15 ? '낮음' :
                              stats.cv < 30 ? '중간' : '높음';
      
      return {
        variability: cvInterpretation,
        summary: `변동계수(CV)는 ${stats.cv.toFixed(2)}%로, 데이터의 상대적 산포도는 ${cvInterpretation}입니다.`
      };
    },

    /**
     * 분포 해석
     */
    interpretDistribution(stats) {
      const skewInterpretation = Math.abs(stats.skewness) < 0.5 ? '대칭에 가까움' :
                                Math.abs(stats.skewness) < 1 ? '약간 비대칭' : '심한 비대칭';
      
      const kurtosisInterpretation = Math.abs(stats.kurtosis) < 0.5 ? '정규분포에 가까움' :
                                    Math.abs(stats.kurtosis) < 1 ? '약간 다름' : '매우 다름';
      
      return {
        skewness: skewInterpretation,
        kurtosis: kurtosisInterpretation,
        summary: `분포는 ${skewInterpretation}이며, 첨도는 정규분포와 ${kurtosisInterpretation}입니다.`
      };
    },

    /**
     * 정규성 검정 (간단한 버전)
     */
    testNormality(data) {
      const stats = this.calculate(data);
      const skewness = Math.abs(stats.skewness);
      const kurtosis = Math.abs(stats.kurtosis);
      
      let normality = '정규분포에 가까움';
      if (skewness > 1 || kurtosis > 1) {
        normality = '정규분포와 차이 있음';
      } else if (skewness > 0.5 || kurtosis > 0.5) {
        normality = '약간의 차이 있음';
      }
      
      return {
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
        normality,
        isNormal: skewness <= 1 && kurtosis <= 1
      };
    }
  },

  // 가설검정
  HypothesisTest: {
    /**
     * 독립표본 t-검정 (Welch's t-test)
     * @param {Array} group1 - 첫 번째 그룹
     * @param {Array} group2 - 두 번째 그룹
     * @returns {Object} t-검정 결과
     */
    independentTTest(group1, group2) {
      Utils.validateInput(group1, 2);
      Utils.validateInput(group2, 2);

      const n1 = group1.length;
      const n2 = group2.length;
      const mean1 = MathUtils.mean(group1);
      const mean2 = MathUtils.mean(group2);
      const var1 = MathUtils.variance(group1);
      const var2 = MathUtils.variance(group2);
      
      // Welch's t-test
      const standardError = Math.sqrt((var1/n1) + (var2/n2));
      const t = (mean1 - mean2) / standardError;
      
      // Welch-Satterthwaite equation for degrees of freedom
      const df = Math.floor(
        Math.pow((var1/n1 + var2/n2), 2) / 
        (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1))
      );
      
      const pValue = 2 * (1 - Distributions.tCDF(Math.abs(t), df));
      
      // Cohen's d (pooled standard deviation)
      const pooledStd = Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
      const cohensD = Math.abs(mean1 - mean2) / pooledStd;
      
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;
      
      return {
        t: Number(t.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(4)),
        cohensD: Number(cohensD.toFixed(4)),
        significant,
        effectSize: this.interpretEffectSize(cohensD),
        mean1: Number(mean1.toFixed(4)),
        mean2: Number(mean2.toFixed(4)),
        standardError: Number(standardError.toFixed(4)),
        n1,
        n2,
        summary: `t(${df}) = ${t.toFixed(3)}, p = ${pValue.toFixed(3)}, Cohen's d = ${cohensD.toFixed(3)}`
      };
    },

    /**
     * 대응표본 t-검정
     * @param {Array} before - 사전 측정값
     * @param {Array} after - 사후 측정값
     * @returns {Object} 대응표본 t-검정 결과
     */
    pairedTTest(before, after) {
      if (before.length !== after.length) {
        throw new Error('대응표본의 크기가 같아야 합니다.');
      }
      Utils.validateInput(before, 2);

      const differences = before.map((b, i) => after[i] - b);
      const n = differences.length;
      const meanDiff = MathUtils.mean(differences);
      const stdDiff = MathUtils.standardDeviation(differences);
      const standardError = stdDiff / Math.sqrt(n);
      const t = meanDiff / standardError;
      const df = n - 1;
      const pValue = 2 * (1 - Distributions.tCDF(Math.abs(t), df));
      const cohensD = Math.abs(meanDiff) / stdDiff;
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;

      return {
        t: Number(t.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(4)),
        cohensD: Number(cohensD.toFixed(4)),
        significant,
        effectSize: this.interpretEffectSize(cohensD),
        meanDiff: Number(meanDiff.toFixed(4)),
        standardError: Number(standardError.toFixed(4)),
        n,
        summary: `t(${df}) = ${t.toFixed(3)}, p = ${pValue.toFixed(3)}, Cohen's d = ${cohensD.toFixed(3)}`
      };
    },

    /**
     * 일원분산분석 (ANOVA)
     * @param {Array[]} groups - 그룹들의 배열
     * @returns {Object} ANOVA 결과
     */
    oneWayANOVA(groups) {
      if (!Array.isArray(groups) || groups.length < 2) {
        throw new Error('최소 2개의 그룹이 필요합니다.');
      }

      const k = groups.length; // 집단 수
      const n = groups.reduce((sum, group) => sum + group.length, 0); // 전체 표본 수
      
      if (n - k <= 0) {
        throw new Error('각 그룹에 충분한 데이터가 필요합니다.');
      }

      // 전체 평균
      const allValues = groups.flat();
      const grandMean = MathUtils.mean(allValues);
      
      // 집단 간 제곱합 (SSB)
      const ssb = groups.reduce((sum, group) => {
        const groupMean = MathUtils.mean(group);
        return sum + group.length * Math.pow(groupMean - grandMean, 2);
      }, 0);
      
      // 집단 내 제곱합 (SSW)
      const ssw = groups.reduce((sum, group) => {
        const groupMean = MathUtils.mean(group);
        return sum + group.reduce((s, value) => s + Math.pow(value - groupMean, 2), 0);
      }, 0);
      
      // 자유도
      const dfb = k - 1; // 집단 간 자유도
      const dfw = n - k; // 집단 내 자유도
      
      // 평균제곱
      const msb = ssb / dfb;
      const msw = ssw / dfw;
      
      // F 통계량
      const f = msb / msw;
      
      // p-값 계산
      const pValue = 1 - Distributions.fCDF(f, dfb, dfw);
      
      // 에타 제곱 (효과크기)
      const etaSquared = ssb / (ssb + ssw);
      
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;
      
      return {
        f: Number(f.toFixed(4)),
        dfb,
        dfw,
        ssb: Number(ssb.toFixed(4)),
        ssw: Number(ssw.toFixed(4)),
        msb: Number(msb.toFixed(4)),
        msw: Number(msw.toFixed(4)),
        pValue: Number(pValue.toFixed(4)),
        etaSquared: Number(etaSquared.toFixed(4)),
        significant,
        effectSize: this.interpretEtaSquared(etaSquared),
        summary: `F(${dfb}, ${dfw}) = ${f.toFixed(3)}, p = ${pValue.toFixed(3)}, η² = ${etaSquared.toFixed(3)}`
      };
    },

    /**
     * 카이제곱 적합도 검정
     * @param {Array} observed - 관찰빈도
     * @param {Array} expected - 기대빈도 (선택적)
     * @returns {Object} 카이제곱 검정 결과
     */
    chiSquareTest(observed, expected = null) {
      Utils.validateInput(observed, 1);
      const n = observed.length;
      
      // 기대빈도가 주어지지 않은 경우, 균등분포 가정
      if (!expected) {
        const expectedValue = observed.reduce((sum, val) => sum + val, 0) / n;
        expected = new Array(n).fill(expectedValue);
      }
      
      if (observed.length !== expected.length) {
        throw new Error('관찰빈도와 기대빈도의 길이가 같아야 합니다.');
      }

      // 기대빈도가 5 미만인 셀 확인
      const lowExpected = expected.filter(e => e < 5).length;
      if (lowExpected > 0) {
        console.warn(`기대빈도가 5 미만인 셀이 ${lowExpected}개 있습니다. 결과 해석에 주의가 필요합니다.`);
      }
      
      // 카이제곱 통계량 계산
      const chiSquare = observed.reduce((sum, obs, i) => {
        return sum + Math.pow(obs - expected[i], 2) / expected[i];
      }, 0);
      
      const df = n - 1;
      const pValue = 1 - Distributions.chiSquaredCDF(chiSquare, df);
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;
      
      // Cramer's V 계산 (효과크기)
      const totalSum = observed.reduce((sum, val) => sum + val, 0);
      const cramerV = Math.sqrt(chiSquare / (totalSum * (Math.min(n, 2) - 1)));
      
      return {
        chiSquare: Number(chiSquare.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(4)),
        significant,
        cramerV: Number(cramerV.toFixed(4)),
        effectSize: this.interpretCramerV(cramerV),
        observed,
        expected: expected.map(e => Number(e.toFixed(2))),
        summary: `χ²(${df}) = ${chiSquare.toFixed(3)}, p = ${pValue.toFixed(3)}, Cramer's V = ${cramerV.toFixed(3)}`
      };
    },

<


    // 효과크기 해석 (Cohen's d)
    interpretEffectSize(cohensD) {
      const abs = Math.abs(cohensD);
      if (abs < 0.2) return '무시할만한 수준';
      if (abs < 0.5) return '작은 효과';
      if (abs < 0.8) return '중간 효과';
      return '큰 효과';
    },

    // 에타 제곱 해석
    interpretEtaSquared(etaSquared) {
      if (etaSquared < 0.01) return '무시할만한 수준';
      if (etaSquared < 0.06) return '작은 효과';
      if (etaSquared < 0.14) return '중간 효과';
      return '큰 효과';
    },

    // Cramer's V 해석
    interpretCramerV(cramerV) {
      if (cramerV < 0.1) return '무시할만한 수준';
      if (cramerV < 0.3) return '작은 효과';
      if (cramerV < 0.5) return '중간 효과';
      return '큰 효과';
    }
  },

  // 상관분석
  Correlation: {
    // 피어슨 상관계수
    pearson(x, y) {
      if (x.length !== y.length) {
        throw new Error('변수의 길이가 같아야 합니다.');
      }
      
      const correlation = ss.sampleCorrelation(x, y);
      const n = x.length;
      const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
      const pValue = 2 * (1 - ss.tDistribution.cdf(Math.abs(t), n - 2));
      
      return {
        correlation,
        pValue,
        significant: pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL,
        strength: this.interpretCorrelation(correlation)
      };
    },

    // 스피어만 상관계수
    spearman(x, y) {
      if (x.length !== y.length) {
        throw new Error('변수의 길이가 같아야 합니다.');
      }
      
      const xRanks = this.calculateRanks(x);
      const yRanks = this.calculateRanks(y);
      
      const dSquared = xRanks.reduce((sum, rank, i) => 
        sum + Math.pow(rank - yRanks[i], 2), 0
      );
      
      const n = x.length;
      const correlation = 1 - (6 * dSquared) / (n * (n * n - 1));
      const z = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
      const pValue = 2 * (1 - ss.standardNormal.cdf(Math.abs(z)));
      
      return {
        correlation,
        pValue,
        significant: pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL,
        strength: this.interpretCorrelation(correlation)
      };
    },

    // 순위 계산
    calculateRanks(data) {
      return Statistics.Utils.calculateRanks(data);
    },

    // 상관계수 해석
    interpretCorrelation(correlation) {
      const abs = Math.abs(correlation);
      if (abs >= 0.9) return '매우 강한';
      if (abs >= 0.7) return '강한';
      if (abs >= 0.5) return '중간';
      if (abs >= 0.3) return '약한';
      return '매우 약한';
    }
  },

  // 회귀분석
  Regression: {
    // 행렬 연산 헬퍼 함수들
    transposeMatrix(matrix) {
      return matrix[0].map((_, i) => matrix.map(row => row[i]));
    },

    matrixMultiply(a, b) {
      if (typeof b[0] === 'number') {
        return a.map(row => row.reduce((sum, ai, i) => sum + ai * b[i], 0));
      }
      return a.map(row => 
        b[0].map((_, j) => row.reduce((sum, ai, i) => sum + ai * b[i][j], 0))
      );
    },

    matrixInverse(matrix) {
      const n = matrix.length;
      const augmented = matrix.map((row, i) => {
        const identity = new Array(n).fill(0);
        identity[i] = 1;
        return [...row, ...identity];
      });
      
      // 가우스-조르단 소거법
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
      
      return augmented.map(row => row.slice(n));
    },

    // 단순선형회귀
    simpleLinear(x, y) {
      if (x.length !== y.length) {
        throw new Error('변수의 길이가 같아야 합니다.');
      }
      
      const n = x.length;
      const sumX = ss.sum(x);
      const sumY = ss.sum(y);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // 예측값 계산
      const yPred = x.map(xi => slope * xi + intercept);
      const yMean = ss.mean(y);
      
      // R² 계산
      const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - yPred[i], 2), 0);
      const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
      const r2 = 1 - (ssRes / ssTot);
      
      // F 통계량과 p-값
      const dfReg = 1;
      const dfRes = n - 2;
      const msReg = (ssTot - ssRes) / dfReg;
      const msRes = ssRes / dfRes;
      const fStat = msReg / msRes;
      const pValue = 1 - ss.fDistribution.cdf(fStat, dfReg, dfRes);
      
      // 표준오차
      const se = Math.sqrt(msRes);
      
      return {
        slope,
        intercept,
        r2,
        fStat,
        pValue,
        se,
        significant: pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL,
        equation: `y = ${intercept.toFixed(3)} + ${slope.toFixed(3)}x`
      };
    },

    // 다중회귀
    multipleLinear(X, y) {
      const n = X.length;
      const k = X[0].length;
      
      // 최소제곱 추정
      const Xt = this.transposeMatrix(X);
      const XtX = this.matrixMultiply(Xt, X);
      const XtXInv = this.matrixInverse(XtX);
      const Xty = this.matrixMultiply(Xt, y);
      const coefficients = this.matrixMultiply(XtXInv, Xty);
      
      // 예측값 계산
      const yPred = X.map(row => 
        row.reduce((sum, xi, i) => sum + xi * coefficients[i], 0)
      );
      
      // R² 계산
      const yMean = ss.mean(y);
      const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - yPred[i], 2), 0);
      const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
      const r2 = 1 - (ssRes / ssTot);
      
      // F 통계량과 p-값
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
      
      return {
        coefficients,
        r2,
        fStat,
        fPValue,
        pValues,
        significant: fPValue < CONFIG.STATS.SIGNIFICANCE_LEVEL,
        equation: `y = ${coefficients.map((coef, i) => 
          `${coef.toFixed(3)}${i === 0 ? '' : `x${i}`}`
        ).join(' + ')}`
      };
    }
  },

  // 비모수 검정
  NonParametric: {
    // 맨휘트니 U 검정
    mannWhitney(group1, group2) {
      const ranks = this.calculateRanks([...group1, ...group2]);
      const n1 = group1.length;
      const n2 = group2.length;
      
      const r1 = ranks.slice(0, n1).reduce((a, b) => a + b, 0);
      const u1 = r1 - (n1 * (n1 + 1)) / 2;
      const u2 = n1 * n2 - u1;
      
      const u = Math.min(u1, u2);
      const z = (u - (n1 * n2) / 2) / Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
      const pValue = 2 * (1 - ss.standardNormal.cdf(Math.abs(z)));
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;
      
      // 효과크기 (r) 계산
      const r = Math.abs(z) / Math.sqrt(n1 + n2);
      
      return {
        u,
        z,
        pValue,
        significant,
        effectSize: r,
        interpretation: this.interpretEffectSize(r),
        n1,
        n2,
        meanRank1: r1 / n1,
        meanRank2: (ranks.reduce((a, b) => a + b, 0) - r1) / n2
      };
    },

    // 윌콕슨 부호 순위 검정
    wilcoxonSignedRank(before, after) {
      if (before.length !== after.length) {
        throw new Error('대응표본의 크기가 같아야 합니다.');
      }

      // 차이 계산 및 0인 차이 제외
      const differences = before.map((b, i) => after[i] - b)
                               .filter(d => d !== 0);
      const n = differences.length;

      // 절대값으로 순위 계산
      const ranks = this.calculateRanks(differences.map(Math.abs));

      // 부호를 고려한 순위합 계산
      let positiveSum = 0;
      let negativeSum = 0;
      differences.forEach((d, i) => {
        if (d > 0) positiveSum += ranks[i];
        else negativeSum += ranks[i];
      });

      // 검정통계량 W (더 작은 순위합)
      const w = Math.min(positiveSum, negativeSum);

      // 정규근사를 위한 z-통계량
      const mean = (n * (n + 1)) / 4;
      const std = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
      const z = (w - mean) / std;
      const pValue = 2 * (1 - ss.standardNormal.cdf(Math.abs(z)));
      const significant = pValue < CONFIG.STATS.SIGNIFICANCE_LEVEL;

      // 효과크기 (r) 계산
      const r = Math.abs(z) / Math.sqrt(n);

      return {
        w,
        z,
        pValue,
        significant,
        effectSize: r,
        interpretation: this.interpretEffectSize(r),
        n,
        positiveRanks: positiveSum,
        negativeRanks: negativeSum
      };
    },

    // 효과크기 해석
    interpretEffectSize(r) {
      if (r < 0.1) return '무시할만한 수준';
      if (r < 0.3) return '작은 효과';
      if (r < 0.5) return '중간 효과';
      return '큰 효과';
    },

    // 순위 계산 (동점 처리 포함)
    calculateRanks(data) {
      return Statistics.Utils.calculateRanks(data);
    }
  },

  // 시계열 분석
  TimeSeries: {
    // 시계열 분석
    analyze(x, y) {
      const trend = this.calculateTrend(x);
      const seasonality = this.analyzeSeasonality(y);
      
      return {
        trend,
        seasonality,
        correlation: ss.sampleCorrelation(x, y)
      };
    },

    // 추세 분석
    calculateTrend(data) {
      const n = data.length;
      const x = Array.from({length: n}, (_, i) => i);
      
      // 선형 회귀로 추세 계산
      const regression = Statistics.Regression.simpleLinear(x, data);
      
      // 이동평균 계산 (기간: 3)
      const ma = [];
      for (let i = 1; i < n - 1; i++) {
        ma.push((data[i-1] + data[i] + data[i+1]) / 3);
      }
      
      return {
        slope: regression.slope,
        intercept: regression.intercept,
        movingAverage: ma,
        type: regression.slope > 0 ? '상승' : regression.slope < 0 ? '하락' : '정체'
      };
    },

    // 계절성 분석
    analyzeSeasonality(data, period = 12) {
      const n = data.length;
      if (n < period * 2) {
        return {
          seasonal: false,
          message: '계절성 분석을 위한 충분한 데이터가 없습니다.'
        };
      }
      
      // 계절 평균 계산
      const seasonalMeans = new Array(period).fill(0);
      const seasonalCounts = new Array(period).fill(0);
      
      for (let i = 0; i < n; i++) {
        const season = i % period;
        seasonalMeans[season] += data[i];
        seasonalCounts[season]++;
      }
      
      for (let i = 0; i < period; i++) {
        seasonalMeans[i] /= seasonalCounts[i];
      }
      
      // 계절성 강도 계산
      const globalMean = ss.mean(data);
      const seasonalStrength = Math.sqrt(
        seasonalMeans.reduce((sum, mean) => 
          sum + Math.pow(mean - globalMean, 2), 0) / period
      ) / globalMean;
      
      return {
        seasonal: seasonalStrength > 0.1,
        strength: seasonalStrength,
        means: seasonalMeans,
        interpretation: this.interpretSeasonality(seasonalStrength)
      };
    },

    // 계절성 강도 해석
    interpretSeasonality(strength) {
      if (strength < 0.1) return '계절성 없음';
      if (strength < 0.3) return '약한 계절성';
      if (strength < 0.5) return '중간 계절성';
      return '강한 계절성';
    }
  }
};

// 전역 객체로 내보내기
window.Statistics = Statistics;