// 공통 유틸리티 함수들
const Utils = {
  // DOM 유틸리티
  DOM: {
    // 요소 생성
    createElement(tag, className = '', innerHTML = '') {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (innerHTML) element.innerHTML = innerHTML;
      return element;
    },

    // 요소 선택
    $(selector) {
      return document.querySelector(selector);
    },

    // 요소들 선택
    $$(selector) {
      return document.querySelectorAll(selector);
    },

    // 부모 요소 찾기
    findParent(element, selector) {
      while (element && element !== document) {
        if (element.matches(selector)) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    },

    // 이벤트 리스너 추가
    addEvent(element, event, handler, options = {}) {
      if (typeof element === 'string') {
        element = this.$(element);
      }
      if (element) {
        element.addEventListener(event, handler, options);
      }
    },

    // 이벤트 리스너 제거
    removeEvent(element, event, handler) {
      if (typeof element === 'string') {
        element = this.$(element);
      }
      if (element) {
        element.removeEventListener(event, handler);
      }
    }
  },

  // 배열 유틸리티
  Array: {
    // 배열 중복 제거
    unique(array) {
      return [...new Set(array)];
    },

    // 배열 그룹화
    groupBy(array, key) {
      return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      }, {});
    },

    // 배열 섞기
    shuffle(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },

    // 배열 분할
    chunk(array, size) {
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    },

    // 배열 평탄화
    flatten(array) {
      return array.reduce((flat, item) => {
        return flat.concat(Array.isArray(item) ? this.flatten(item) : item);
      }, []);
    }
  },

  // 객체 유틸리티
  Object: {
    // 깊은 복사
    deepClone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(item => this.deepClone(item));
      if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = this.deepClone(obj[key]);
          }
        }
        return cloned;
      }
    },

    // 객체 병합
    merge(target, ...sources) {
      sources.forEach(source => {
        for (const key in source) {
          if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
              target[key] = this.merge(target[key] || {}, source[key]);
            } else {
              target[key] = source[key];
            }
          }
        }
      });
      return target;
    },

    // 객체 키 존재 확인
    has(obj, path) {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return false;
        }
      }
      
      return true;
    },

    // 객체 값 가져오기
    get(obj, path, defaultValue = undefined) {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      
      return current;
    }
  },

  // 문자열 유틸리티
  String: {
    // 카멜케이스로 변환
    toCamelCase(str) {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },

    // 케밥케이스로 변환
    toKebabCase(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    // 파스칼케이스로 변환
    toPascalCase(str) {
      return str.charAt(0).toUpperCase() + this.toCamelCase(str.slice(1));
    },

    // 문자열 자르기
    truncate(str, length, suffix = '...') {
      if (str.length <= length) return str;
      return str.substring(0, length) + suffix;
    },

    // 문자열 포맷팅
    format(template, ...args) {
      return template.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? args[number] : match;
      });
    }
  },

  // 숫자 유틸리티
  Number: {
    // 숫자 포맷팅
    format(num, decimals = 2) {
      return Number(num).toFixed(decimals);
    },

    // 범위 내 숫자로 제한
    clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
    },

    // 랜덤 정수 생성
    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 랜덤 실수 생성
    randomFloat(min, max) {
      return Math.random() * (max - min) + min;
    },

    // 숫자가 범위 내에 있는지 확인
    isInRange(num, min, max) {
      return num >= min && num <= max;
    }
  },

  // 날짜 유틸리티
  Date: {
    // 현재 날짜 문자열
    now(format = 'YYYY-MM-DD HH:mm:ss') {
      const now = new Date();
      return this.format(now, format);
    },

    // 날짜 포맷팅
    format(date, format = 'YYYY-MM-DD') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    // 상대적 시간
    timeAgo(date) {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}일 전`;
      if (hours > 0) return `${hours}시간 전`;
      if (minutes > 0) return `${minutes}분 전`;
      return `${seconds}초 전`;
    }
  },

  // 파일 유틸리티
  File: {
    // 파일 크기 포맷팅
    formatSize(bytes) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Bytes';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    // 파일 확장자 확인
    getExtension(filename) {
      return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    // 파일 타입 확인
    isImage(filename) {
      const ext = this.getExtension(filename).toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    },

    // 파일 다운로드
    download(data, filename, type = 'text/plain') {
      const blob = new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  // 로컬 스토리지 유틸리티
  Storage: {
    // 데이터 저장
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('스토리지 저장 실패:', error);
        return false;
      }
    },

    // 데이터 가져오기
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('스토리지 읽기 실패:', error);
        return defaultValue;
      }
    },

    // 데이터 삭제
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('스토리지 삭제 실패:', error);
        return false;
      }
    },

    // 모든 데이터 삭제
    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn('스토리지 초기화 실패:', error);
        return false;
      }
    }
  },

  // 비동기 유틸리티
  Async: {
    // 지연 함수
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 재시도 함수
    async retry(fn, maxAttempts = 3, delay = 1000) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          if (attempt === maxAttempts) throw error;
          await this.delay(delay * attempt);
        }
      }
    },

    // 병렬 실행
    async parallel(tasks) {
      return Promise.all(tasks.map(task => task()));
    },

    // 순차 실행
    async sequential(tasks) {
      const results = [];
      for (const task of tasks) {
        results.push(await task());
      }
      return results;
    }
  },

  // 검증 유틸리티
  Validation: {
    // 이메일 검증
    isEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },

    // URL 검증
    isURL(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    // 숫자 검증
    isNumber(value) {
      return !isNaN(value) && typeof value === 'number';
    },

    // 빈 값 검증
    isEmpty(value) {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim().length === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    }
  }
};

// 전역 객체로 내보내기
window.Utils = Utils;
