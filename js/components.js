// 재사용 가능한 UI 컴포넌트들
const Components = {
  // 토스트 메시지 컴포넌트
  Toast: {
    container: null,

    // 초기화
    init() {
      if (!this.container) {
        this.container = Utils.DOM.createElement('div', 'toast-container');
        document.body.appendChild(this.container);
      }
    },

    // 토스트 표시
    show(message, type = 'info', duration = 3000) {
      this.init();
      
      const toast = Utils.DOM.createElement('div', `toast toast-${type}`);
      toast.innerHTML = `
        <div class="toast-content">
          <span class="toast-message">${message}</span>
          <button class="toast-close">&times;</button>
        </div>
      `;

      // 닫기 버튼 이벤트
      const closeBtn = toast.querySelector('.toast-close');
      Utils.DOM.addEvent(closeBtn, 'click', () => this.hide(toast));

      this.container.appendChild(toast);

      // 애니메이션
      setTimeout(() => toast.classList.add('show'), 10);

      // 자동 숨김
      if (duration > 0) {
        setTimeout(() => this.hide(toast), duration);
      }

      return toast;
    },

    // 토스트 숨김
    hide(toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },

    // 성공 토스트
    success(message, duration) {
      return this.show(message, 'success', duration);
    },

    // 에러 토스트
    error(message, duration) {
      return this.show(message, 'error', duration);
    },

    // 경고 토스트
    warning(message, duration) {
      return this.show(message, 'warning', duration);
    },

    // 정보 토스트
    info(message, duration) {
      return this.show(message, 'info', duration);
    }
  },

  // 모달 컴포넌트
  Modal: {
    // 모달 생성
    create(options = {}) {
      const {
        title = '',
        content = '',
        width = '500px',
        height = 'auto',
        closable = true,
        onClose = null
      } = options;

      const modal = Utils.DOM.createElement('div', 'modal-overlay');
      modal.innerHTML = `
        <div class="modal" style="width: ${width}; height: ${height};">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            ${closable ? '<button class="modal-close">&times;</button>' : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      `;

      // 닫기 버튼 이벤트
      if (closable) {
        const closeBtn = modal.querySelector('.modal-close');
        Utils.DOM.addEvent(closeBtn, 'click', () => this.close(modal, onClose));
        Utils.DOM.addEvent(modal, 'click', (e) => {
          if (e.target === modal) {
            this.close(modal, onClose);
          }
        });
      }

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);

      return modal;
    },

    // 모달 닫기
    close(modal, onClose) {
      modal.classList.remove('show');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (onClose) onClose();
      }, 300);
    },

    // 확인 모달
    confirm(message, onConfirm, onCancel) {
      const content = `
        <div class="confirm-content">
          <p>${message}</p>
          <div class="confirm-buttons">
            <button class="btn btn-secondary" data-action="cancel">취소</button>
            <button class="btn btn-primary" data-action="confirm">확인</button>
          </div>
        </div>
      `;

      const modal = this.create({
        title: '확인',
        content,
        width: '400px'
      });

      const buttons = modal.querySelectorAll('[data-action]');
      buttons.forEach(btn => {
        Utils.DOM.addEvent(btn, 'click', () => {
          const action = btn.dataset.action;
          this.close(modal);
          if (action === 'confirm' && onConfirm) onConfirm();
          if (action === 'cancel' && onCancel) onCancel();
        });
      });

      return modal;
    },

    // 입력 모달
    prompt(message, defaultValue = '', onConfirm, onCancel) {
      const content = `
        <div class="prompt-content">
          <p>${message}</p>
          <input type="text" class="prompt-input" value="${defaultValue}" placeholder="입력하세요">
          <div class="prompt-buttons">
            <button class="btn btn-secondary" data-action="cancel">취소</button>
            <button class="btn btn-primary" data-action="confirm">확인</button>
          </div>
        </div>
      `;

      const modal = this.create({
        title: '입력',
        content,
        width: '400px'
      });

      const input = modal.querySelector('.prompt-input');
      const buttons = modal.querySelectorAll('[data-action]');

      buttons.forEach(btn => {
        Utils.DOM.addEvent(btn, 'click', () => {
          const action = btn.dataset.action;
          this.close(modal);
          if (action === 'confirm' && onConfirm) onConfirm(input.value);
          if (action === 'cancel' && onCancel) onCancel();
        });
      });

      // Enter 키 이벤트
      Utils.DOM.addEvent(input, 'keypress', (e) => {
        if (e.key === 'Enter') {
          this.close(modal);
          if (onConfirm) onConfirm(input.value);
        }
      });

      input.focus();
      return modal;
    }
  },

  // 로딩 스피너 컴포넌트
  Spinner: {
    // 스피너 생성
    create(text = '로딩 중...') {
      const spinner = Utils.DOM.createElement('div', 'spinner-overlay');
      spinner.innerHTML = `
        <div class="spinner">
          <div class="spinner-icon"></div>
          <div class="spinner-text">${text}</div>
        </div>
      `;

      document.body.appendChild(spinner);
      setTimeout(() => spinner.classList.add('show'), 10);

      return spinner;
    },

    // 스피너 숨김
    hide(spinner) {
      spinner.classList.remove('show');
      setTimeout(() => {
        if (spinner.parentNode) {
          spinner.parentNode.removeChild(spinner);
        }
      }, 300);
    },

    // 전체 화면 스피너
    showFullscreen(text) {
      return this.create(text);
    }
  },

  // 탭 컴포넌트
  Tabs: {
    // 탭 생성
    create(container, tabs) {
      const tabContainer = Utils.DOM.createElement('div', 'tabs-container');
      
      // 탭 헤더
      const tabHeader = Utils.DOM.createElement('div', 'tabs-header');
      const tabContent = Utils.DOM.createElement('div', 'tabs-content');

      tabs.forEach((tab, index) => {
        const tabButton = Utils.DOM.createElement('button', 'tab-button');
        tabButton.textContent = tab.title;
        tabButton.dataset.tab = index;

        const tabPanel = Utils.DOM.createElement('div', 'tab-panel');
        tabPanel.innerHTML = tab.content;
        tabPanel.dataset.tab = index;

        tabHeader.appendChild(tabButton);
        tabContent.appendChild(tabPanel);

        // 첫 번째 탭 활성화
        if (index === 0) {
          tabButton.classList.add('active');
          tabPanel.classList.add('active');
        }
      });

      // 탭 클릭 이벤트
      Utils.DOM.addEvent(tabHeader, 'click', (e) => {
        if (e.target.classList.contains('tab-button')) {
          const tabIndex = e.target.dataset.tab;
          this.switchTab(tabContainer, tabIndex);
        }
      });

      tabContainer.appendChild(tabHeader);
      tabContainer.appendChild(tabContent);
      container.appendChild(tabContainer);

      return tabContainer;
    },

    // 탭 전환
    switchTab(container, tabIndex) {
      const buttons = container.querySelectorAll('.tab-button');
      const panels = container.querySelectorAll('.tab-panel');

      buttons.forEach(btn => btn.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('active'));

      const activeButton = container.querySelector(`[data-tab="${tabIndex}"]`);
      const activePanel = container.querySelector(`.tab-panel[data-tab="${tabIndex}"]`);

      if (activeButton) activeButton.classList.add('active');
      if (activePanel) activePanel.classList.add('active');
    }
  },

  // 테이블 컴포넌트
  Table: {
    // 테이블 생성
    create(data, options = {}) {
      const {
        headers = [],
        sortable = false,
        searchable = false,
        pagination = false,
        pageSize = 10
      } = options;

      const tableContainer = Utils.DOM.createElement('div', 'table-container');
      
      // 검색 기능
      if (searchable) {
        const searchBox = Utils.DOM.createElement('div', 'table-search');
        searchBox.innerHTML = `
          <input type="text" class="search-input" placeholder="검색...">
        `;
        tableContainer.appendChild(searchBox);
      }

      // 테이블 생성
      const table = Utils.DOM.createElement('table', 'data-table');
      
      // 헤더 생성
      if (headers.length > 0) {
        const thead = Utils.DOM.createElement('thead');
        const headerRow = Utils.DOM.createElement('tr');
        
        headers.forEach(header => {
          const th = Utils.DOM.createElement('th');
          th.textContent = header;
          if (sortable) {
            th.classList.add('sortable');
            Utils.DOM.addEvent(th, 'click', () => this.sortTable(table, header));
          }
          headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
      }

      // 본문 생성
      const tbody = Utils.DOM.createElement('tbody');
      this.renderTableBody(tbody, data);
      table.appendChild(tbody);
      
      tableContainer.appendChild(table);

      // 페이지네이션
      if (pagination && data.length > pageSize) {
        const paginationContainer = this.createPagination(data.length, pageSize);
        tableContainer.appendChild(paginationContainer);
      }

      return tableContainer;
    },

    // 테이블 본문 렌더링
    renderTableBody(tbody, data) {
      tbody.innerHTML = '';
      
      data.forEach(row => {
        const tr = Utils.DOM.createElement('tr');
        
        if (Array.isArray(row)) {
          row.forEach(cell => {
            const td = Utils.DOM.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
          });
        } else {
          Object.values(row).forEach(value => {
            const td = Utils.DOM.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
          });
        }
        
        tbody.appendChild(tr);
      });
    },

    // 테이블 정렬
    sortTable(table, column) {
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const columnIndex = Array.from(table.querySelectorAll('th')).findIndex(th => th.textContent === column);
      
      if (columnIndex === -1) return;

      const sortedRows = rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent;
        const bValue = b.cells[columnIndex].textContent;
        
        // 숫자 정렬
        if (!isNaN(aValue) && !isNaN(bValue)) {
          return parseFloat(aValue) - parseFloat(bValue);
        }
        
        // 문자열 정렬
        return aValue.localeCompare(bValue);
      });

      tbody.innerHTML = '';
      sortedRows.forEach(row => tbody.appendChild(row));
    },

    // 페이지네이션 생성
    createPagination(totalItems, pageSize) {
      const totalPages = Math.ceil(totalItems / pageSize);
      const pagination = Utils.DOM.createElement('div', 'pagination');
      
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = Utils.DOM.createElement('button', 'page-button');
        pageButton.textContent = i;
        if (i === 1) pageButton.classList.add('active');
        pagination.appendChild(pageButton);
      }
      
      return pagination;
    }
  },

  // 차트 컴포넌트
  Chart: {
    // 차트 생성
    create(container, data, options = {}) {
      const {
        type = 'line',
        title = '',
        xLabel = '',
        yLabel = '',
        colors = CONFIG.CHART.COLORS,
        height = CONFIG.CHART.DEFAULT_HEIGHT
      } = options;

      const chartContainer = Utils.DOM.createElement('div', 'chart-container');
      chartContainer.style.height = `${height}px`;
      
      if (title) {
        const titleElement = Utils.DOM.createElement('h3', 'chart-title');
        titleElement.textContent = title;
        chartContainer.appendChild(titleElement);
      }

      const chartElement = Utils.DOM.createElement('div', 'chart');
      chartContainer.appendChild(chartElement);

      // Plotly 차트 생성
      const trace = {
        x: data.x || [],
        y: data.y || [],
        type: type,
        mode: type === 'scatter' ? 'markers' : undefined,
        marker: {
          color: colors.PRIMARY
        }
      };

      const layout = {
        title: title,
        xaxis: { title: xLabel },
        yaxis: { title: yLabel },
        height: height - (title ? 60 : 0),
        margin: { t: 40, r: 40, b: 60, l: 60 }
      };

      Plotly.newPlot(chartElement, [trace], layout);
      container.appendChild(chartContainer);

      return chartContainer;
    },

    // 차트 업데이트
    update(chartElement, data) {
      const trace = {
        x: data.x || [],
        y: data.y || []
      };

      Plotly.restyle(chartElement, trace);
    }
  },

  // 파일 업로드 컴포넌트
  FileUpload: {
    // 파일 업로드 영역 생성
    create(container, options = {}) {
      const {
        accept = CONFIG.DATA.SUPPORTED_FORMATS.join(','),
        multiple = false,
        maxSize = CONFIG.DATA.MAX_FILE_SIZE,
        onUpload = null,
        onError = null
      } = options;

      const uploadContainer = Utils.DOM.createElement('div', 'file-upload-container');
      uploadContainer.innerHTML = `
        <div class="file-upload-area" id="fileUploadArea">
          <div class="file-upload-content">
            <i class="file-upload-icon">📁</i>
            <p class="file-upload-text">파일을 드래그하여 업로드하거나 클릭하여 선택하세요</p>
            <p class="file-upload-hint">지원 형식: ${accept}</p>
          </div>
          <input type="file" class="file-input" accept="${accept}" ${multiple ? 'multiple' : ''} style="display: none;">
        </div>
        <div class="file-list" id="fileList"></div>
      `;

      const uploadArea = uploadContainer.querySelector('.file-upload-area');
      const fileInput = uploadContainer.querySelector('.file-input');
      const fileList = uploadContainer.querySelector('#fileList');

      // 드래그 앤 드롭 이벤트
      Utils.DOM.addEvent(uploadArea, 'dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });

      Utils.DOM.addEvent(uploadArea, 'dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
      });

      Utils.DOM.addEvent(uploadArea, 'drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files, fileList, { maxSize, onUpload, onError });
      });

      // 클릭 이벤트
      Utils.DOM.addEvent(uploadArea, 'click', () => {
        fileInput.click();
      });

      Utils.DOM.addEvent(fileInput, 'change', (e) => {
        const files = Array.from(e.target.files);
        this.handleFiles(files, fileList, { maxSize, onUpload, onError });
      });

      container.appendChild(uploadContainer);
      return uploadContainer;
    },

    // 파일 처리
    handleFiles(files, fileList, options) {
      const { maxSize, onUpload, onError } = options;

      files.forEach(file => {
        // 파일 크기 검증
        if (file.size > maxSize) {
          const error = `파일 크기가 너무 큽니다: ${Utils.File.formatSize(file.size)}`;
          if (onError) onError(error);
          Components.Toast.error(error);
          return;
        }

        // 파일 형식 검증
        const extension = Utils.File.getExtension(file.name);
        if (!CONFIG.DATA.SUPPORTED_FORMATS.includes(`.${extension}`)) {
          const error = `지원하지 않는 파일 형식입니다: ${extension}`;
          if (onError) onError(error);
          Components.Toast.error(error);
          return;
        }

        // 파일 목록에 추가
        this.addFileToList(file, fileList, onUpload);
      });
    },

    // 파일 목록에 추가
    addFileToList(file, fileList, onUpload) {
      const fileItem = Utils.DOM.createElement('div', 'file-item');
      fileItem.innerHTML = `
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${Utils.File.formatSize(file.size)}</span>
        </div>
        <button class="file-remove">&times;</button>
      `;

      const removeBtn = fileItem.querySelector('.file-remove');
      Utils.DOM.addEvent(removeBtn, 'click', () => {
        fileList.removeChild(fileItem);
      });

      fileList.appendChild(fileItem);

      // 파일 업로드 콜백
      if (onUpload) {
        onUpload(file, fileItem);
      }
    }
  }
};

// 전역 객체로 내보내기
window.Components = Components;
