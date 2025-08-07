// 애플리케이션 설정
const CONFIG = {
  // API 엔드포인트
  API: {
    BASE_URL: window.location.origin,
    TIMEOUT: 30000
  },

  // 차트 설정
  CHART: {
    COLORS: {
      PRIMARY: '#2196F3',
      SECONDARY: '#FF9800',
      SUCCESS: '#4CAF50',
      DANGER: '#F44336',
      WARNING: '#FFC107',
      INFO: '#00BCD4',
      LIGHT: '#F5F5F5',
      DARK: '#333333'
    },
    THEMES: {
      LIGHT: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        gridColor: '#e0e0e0'
      },
      DARK: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        gridColor: '#404040'
      }
    },
    DEFAULT_HEIGHT: 400,
    DEFAULT_WIDTH: 800
  },

  // 데이터 설정
  DATA: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['.csv', '.xlsx', '.xls'],
    MAX_PREVIEW_ROWS: 100,
    DEFAULT_SAMPLE_SIZE: 1000
  },

  // UI 설정
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 60,
    FOOTER_HEIGHT: 60
  },

  // 통계 설정
  STATS: {
    SIGNIFICANCE_LEVEL: 0.05,
    CONFIDENCE_LEVEL: 0.95,
    MAX_ITERATIONS: 1000,
    TOLERANCE: 1e-6
  },

  // 로컬 스토리지 키
  STORAGE: {
    SETTINGS: 'stats_service_settings',
    RECENT_FILES: 'stats_service_recent_files',
    USER_PREFERENCES: 'stats_service_preferences',
    ANALYSIS_HISTORY: 'stats_service_history'
  },

  // 내보내기 설정
  EXPORT: {
    CSV_ENCODING: 'utf-8',
    PNG_QUALITY: 0.9,
    PDF_MARGIN: 20,
    DEFAULT_FILENAME: '분석결과'
  }
};

// 설정 유틸리티 함수들
const ConfigUtils = {
  // 설정 가져오기
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = CONFIG;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  },

  // 설정 설정하기
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let obj = CONFIG;
    
    for (const k of keys) {
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }
    
    obj[lastKey] = value;
  },

  // 로컬 스토리지에서 설정 로드
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE.SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        Object.assign(CONFIG, settings);
      }
    } catch (error) {
      console.warn('설정 로드 실패:', error);
    }
  },

  // 로컬 스토리지에 설정 저장
  saveToStorage() {
    try {
      localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(CONFIG));
    } catch (error) {
      console.warn('설정 저장 실패:', error);
    }
  },

  // 기본 설정으로 초기화
  reset() {
    // CONFIG 객체를 기본값으로 재설정
    window.location.reload();
  }
};

// 전역 객체로 내보내기
window.CONFIG = CONFIG;
window.ConfigUtils = ConfigUtils;
