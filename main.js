(function () {
  const sentenceInput = document.getElementById('sentenceInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsEl = document.getElementById('results');
  const noResultsEl = document.getElementById('noResults');
  const saveFavoriteBtn = document.getElementById('saveFavoriteBtn');
  const randomCoupletBtn = document.getElementById('randomCoupletBtn');
  const favoritesListEl = document.getElementById('favoritesList');
  const noFavoritesEl = document.getElementById('noFavorites');
  const imageZoomModal = document.getElementById('imageZoomModal');
  const imageZoomTarget = document.getElementById('imageZoomTarget');
  const imageZoomGlyph = document.getElementById('imageZoomGlyph');
  const imageZoomCloseBtn = imageZoomModal ? imageZoomModal.querySelector('.image-zoom-close') : null;
  const themeToggleBtn = document.getElementById('themeToggle');

  // 內建示意資料：（實際使用時建議改成你自己準備的字帖圖片或資料來源）
  // 為了避免版權問題，這裡只用占位圖片服務示意，並非真正的書法字帖。
  const builtInData = {
    '隸書': {},
    '楷書': {},
    '行書': {},
    '草書': {},
    '篆書': {},
  };

  // 從 localStorage 載入自訂圖片資料
  function loadCustomData() {
    try {
      const raw = localStorage.getItem('calligraphy-custom-data');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Failed to load custom data', e);
      return {};
    }
  }

  function saveCustomData(data) {
    try {
      localStorage.setItem('calligraphy-custom-data', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save custom data', e);
    }
  }

  let customData = loadCustomData();

  // 收藏句子資料
  function loadFavorites() {
    try {
      const raw = localStorage.getItem('calligraphy-favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load favorites', e);
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem('calligraphy-favorites', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save favorites', e);
    }
  }

  let favorites = loadFavorites();

  // 主題（深夜 / 白天）切換
  function applyTheme(theme) {
    const body = document.body;
    if (!body) return;

    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(theme);

    try {
      localStorage.setItem('calligraphy-theme', theme);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }

    updateThemeToggleLabel();
  }

  function updateThemeToggleLabel() {
    if (!themeToggleBtn) return;
    const body = document.body;
    if (!body) return;

    if (body.classList.contains('theme-dark')) {
      themeToggleBtn.textContent = '切換為白天模式';
    } else {
      themeToggleBtn.textContent = '切換為深夜模式';
    }
  }

  // 範例春聯資料（上下聯）
  const sampleCouplets = [
    { top: '億馬當先', bottom: '' },
    { top: '吉星高照平安宅', bottom: '喜氣常臨富貴門' },
    { top: '新春福到迎祥瑞', bottom: '佳節門開納吉祥' },
    { top: '花開富貴春常在', bottom: '竹報平安福自來' },
    { top: '財運隨馬奔新歲', bottom: '富氣因馬進滿堂' },
  ];

  // 簡單的圖片放大功能
  function openImageZoom(src, alt) {
    if (!imageZoomModal || !imageZoomTarget) return;
    imageZoomModal.classList.remove('show-glyph');
    imageZoomModal.classList.add('show-image');
    imageZoomTarget.src = src;
    imageZoomTarget.alt = alt || '';
    if (imageZoomGlyph) {
      imageZoomGlyph.innerHTML = '';
    }
    imageZoomModal.classList.add('open');
    imageZoomModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function openGlyphZoom(ch, style) {
    if (!imageZoomModal || !imageZoomGlyph) return;
    imageZoomModal.classList.remove('show-image');
    imageZoomModal.classList.add('show-glyph');

    imageZoomGlyph.innerHTML = '';
    const glyph = document.createElement('div');
    glyph.textContent = ch;

    if (style === '楷書') {
      glyph.className = 'char-glyph-kai';
    } else if (style === '隸書') {
      glyph.className = 'char-glyph-li';
    } else if (style === '行書') {
      glyph.className = 'char-glyph-xing';
    } else if (style === '篆書') {
      glyph.className = 'char-glyph-seal';
    } else {
      glyph.className = 'char-glyph-kai';
    }

    imageZoomGlyph.appendChild(glyph);
    if (imageZoomTarget) {
      imageZoomTarget.src = '';
    }

    imageZoomModal.classList.add('open');
    imageZoomModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeImageZoom() {
    if (!imageZoomModal || !imageZoomTarget) return;
    imageZoomModal.classList.remove('open');
    imageZoomModal.classList.remove('show-image');
    imageZoomModal.classList.remove('show-glyph');
    imageZoomModal.setAttribute('aria-hidden', 'true');
    imageZoomTarget.src = '';
    if (imageZoomGlyph) {
      imageZoomGlyph.innerHTML = '';
    }
    document.body.classList.remove('no-scroll');
  }

  if (imageZoomModal) {
    if (imageZoomCloseBtn) {
      imageZoomCloseBtn.addEventListener('click', closeImageZoom);
    }

    imageZoomModal.addEventListener('click', (e) => {
      if (e.target === imageZoomModal || e.target.classList.contains('image-zoom-backdrop')) {
        closeImageZoom();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageZoomModal.classList.contains('open')) {
        closeImageZoom();
      }
    });
  }

  function isChineseChar(ch) {
    // 簡單判斷：只保留常用中日韓統一表意文字區段的字元
    return /[\u4E00-\u9FFF]/.test(ch);
  }

  function getSelectedStyle() {
    const radios = document.querySelectorAll('input[name="style"]');
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return '隸書';
  }

  function normalizeChars(sentence) {
    const chars = [];
    for (const ch of sentence) {
      if (!ch.trim()) continue; // 跳過空白
      if (!isChineseChar(ch)) continue; // 非中文字不轉換
      chars.push(ch);
    }
    return chars;
  }

  function getImageForChar(style, ch) {
    // 先看使用者自訂
    if (customData[ch] && customData[ch][style]) {
      return customData[ch][style];
    }
    // 再看內建資料（目前為空；你可以自行在 builtInData 裡補上圖片網址）
    if (builtInData[style] && builtInData[style][ch] && builtInData[style][ch].length > 0) {
      return builtInData[style][ch][0];
    }
    // 若完全沒有資料，回傳一個占位圖網址做提示
    const text = encodeURIComponent(`${ch}-${style}`);
    return `https://via.placeholder.com/200x200.png?text=${text}`;
  }

  function setCustomImage(style, ch, url) {
    if (!customData[ch]) customData[ch] = {};
    if (url) {
      customData[ch][style] = url;
    } else {
      // 清除自訂
      if (customData[ch][style]) {
        delete customData[ch][style];
      }
    }
    saveCustomData(customData);
  }

  function createCharCard(style, ch) {
    const card = document.createElement('div');
    card.className = 'char-card';

    const header = document.createElement('div');
    header.className = 'char-header';

    const mainChar = document.createElement('div');
    mainChar.className = 'char-main';
    mainChar.textContent = ch;

    const styleLabel = document.createElement('div');
    styleLabel.className = 'char-style';
    styleLabel.textContent = style;

    header.appendChild(mainChar);
    header.appendChild(styleLabel);

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'char-image-wrapper';

    function hasCustomImage() {
      return !!(customData[ch] && customData[ch][style]);
    }

    function renderContent() {
      imageWrapper.innerHTML = '';

      if (style === '楷書' && !hasCustomImage()) {
        // 楷書且沒有自訂圖片時，預設用楷體字型顯示大字
        const glyph = document.createElement('div');
        glyph.className = 'char-glyph-kai';
        glyph.textContent = ch;
        imageWrapper.appendChild(glyph);
      } else if (style === '隸書' && !hasCustomImage()) {
        // 隸書且沒有自訂圖片時，使用 MoeLi 隸書字型顯示大字
        const glyph = document.createElement('div');
        glyph.className = 'char-glyph-li';
        glyph.textContent = ch;
        imageWrapper.appendChild(glyph);
      } else if (style === '行書' && !hasCustomImage()) {
        // 行書且沒有自訂圖片時，使用王漢宗中行書繁字型顯示大字
        const glyph = document.createElement('div');
        glyph.className = 'char-glyph-xing';
        glyph.textContent = ch;
        imageWrapper.appendChild(glyph);
      } else if (style === '篆書' && !hasCustomImage()) {
        // 篆書且沒有自訂圖片時，使用崇羲篆體顯示大字
        const glyph = document.createElement('div');
        glyph.className = 'char-glyph-seal';
        glyph.textContent = ch;
        imageWrapper.appendChild(glyph);
      } else {
        const img = document.createElement('img');
        img.alt = `${ch} - ${style}`;
        img.src = getImageForChar(style, ch);
        imageWrapper.appendChild(img);
      }
    }

    renderContent();

    // 點擊圖片進行放大檢視
    imageWrapper.addEventListener('click', () => {
      const img = imageWrapper.querySelector('img');
      if (img) {
        openImageZoom(img.src, img.alt || `${ch} - ${style}`);
      } else {
        openGlyphZoom(ch, style);
      }
    });

    const footer = document.createElement('div');
    footer.className = 'char-footer';

    const editBtn = document.createElement('button');
    editBtn.textContent = '編輯 / 更換圖片';
    editBtn.addEventListener('click', () => {
      const current = customData[ch] && customData[ch][style] ? customData[ch][style] : '';
      const url = window.prompt(`請輸入「${ch}」的 ${style} 圖片網址：`, current);
      if (url === null) return; // 使用者按取消

      const trimmed = url.trim();
      if (trimmed) {
        setCustomImage(style, ch, trimmed);
        // 有自訂圖片後，改成圖片模式
        renderContent();
        updateButtons();
      } else {
        // 若清空則恢復成預設（占位或內建）
        setCustomImage(style, ch, '');
        renderContent();
        updateButtons();
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = '刪除自訂圖片';
    deleteBtn.addEventListener('click', () => {
      if (!hasCustomImage()) return;
      if (!window.confirm(`確定要刪除「${ch}」的 ${style} 自訂圖片並恢復原本字型嗎？`)) {
        return;
      }
      setCustomImage(style, ch, '');
      renderContent();
      updateButtons();
    });

    const note = document.createElement('div');
    note.className = 'char-note';
    note.textContent = '備註：圖片僅示意，可替換成喜歡的字帖。';

    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);
    footer.appendChild(note);

    card.appendChild(header);
    card.appendChild(imageWrapper);
    card.appendChild(footer);

    function updateButtons() {
      // 有自訂圖片時才顯示刪除按鈕
      if (hasCustomImage()) {
        deleteBtn.style.display = '';
      } else {
        deleteBtn.style.display = 'none';
      }
    }

    // 根據目前狀態初始化按鈕顯示
    updateButtons();

    return card;
  }

  function renderResults(chars, style) {
    resultsEl.innerHTML = '';

    if (!chars.length) {
      noResultsEl.textContent = '沒有可顯示的字，請確認句子裡有中文字。';
      noResultsEl.hidden = false;
      return;
    }

    noResultsEl.hidden = true;

    chars.forEach(ch => {
      const card = createCharCard(style, ch);
      resultsEl.appendChild(card);
    });
  }

  function setSelectedStyle(style) {
    const radios = document.querySelectorAll('input[name="style"]');
    radios.forEach(r => {
      r.checked = (r.value === style);
    });
  }

  function renderFavorites() {
    if (!favoritesListEl || !noFavoritesEl) return;

    favoritesListEl.innerHTML = '';

    if (!favorites.length) {
      noFavoritesEl.hidden = false;
      return;
    }

    noFavoritesEl.hidden = true;

    favorites.forEach(item => {
      const li = document.createElement('li');
      li.className = 'favorite-item';

      const main = document.createElement('div');
      main.className = 'favorite-main';

      const sentenceSpan = document.createElement('span');
      sentenceSpan.className = 'favorite-sentence';
      sentenceSpan.textContent = item.sentence;

      const styleSpan = document.createElement('span');
      styleSpan.className = 'favorite-style';
      styleSpan.textContent = `字體：${item.style}`;

      main.appendChild(sentenceSpan);
      main.appendChild(styleSpan);

      const actions = document.createElement('div');
      actions.className = 'favorite-actions';

      const loadBtn = document.createElement('button');
      loadBtn.textContent = '載入';
      loadBtn.addEventListener('click', () => {
        sentenceInput.value = item.sentence;
        setSelectedStyle(item.style);
        onSearch();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '❌';
      deleteBtn.addEventListener('click', () => {
        favorites = favorites.filter(f => f.id !== item.id);
        saveFavorites(favorites);
        renderFavorites();
      });

      actions.appendChild(loadBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(main);
      li.appendChild(actions);

      favoritesListEl.appendChild(li);
    });
  }

  function addFavorite(sentence, style) {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    // 避免完全重複（同句子同字體）
    const exists = favorites.some(f => f.sentence === trimmed && f.style === style);
    if (exists) {
      return;
    }

    const item = {
      id: Date.now() + Math.random().toString(16).slice(2),
      sentence: trimmed,
      style,
      createdAt: Date.now(),
    };

    favorites.unshift(item);
    saveFavorites(favorites);
    renderFavorites();
  }

  function onSearch() {
    const sentence = sentenceInput.value.trim();
    const style = getSelectedStyle();

    if (!sentence) {
      resultsEl.innerHTML = '';
      noResultsEl.textContent = '請先輸入一句話再搜尋。';
      noResultsEl.hidden = false;
      return;
    }

    const chars = normalizeChars(sentence);
    renderResults(chars, style);
  }

  searchBtn.addEventListener('click', onSearch);

   // 隨機產生春聯上下聯
  if (randomCoupletBtn) {
    randomCoupletBtn.addEventListener('click', () => {
      if (!sampleCouplets.length) return;
      const idx = Math.floor(Math.random() * sampleCouplets.length);
      const pair = sampleCouplets[idx];
      // 將上下聯各一行填入文字框
      sentenceInput.value = pair.top + '\n' + pair.bottom;
      onSearch();
    });
  }

  if (saveFavoriteBtn) {
    saveFavoriteBtn.addEventListener('click', () => {
      const sentence = sentenceInput.value;
      const style = getSelectedStyle();
      if (!sentence.trim()) {
        noResultsEl.textContent = '沒有內容可收藏，請先輸入一句話。';
        noResultsEl.hidden = false;
        return;
      }
      addFavorite(sentence, style);
    });
  }

  sentenceInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onSearch();
    }
  });

  // 主題切換按鈕
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const body = document.body;
      if (!body) return;
      const nextTheme = body.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark';
      applyTheme(nextTheme);
    });
  }

  // 初始化主題（從 localStorage 或預設深夜模式）
  (function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem('calligraphy-theme');
    } catch (e) {
      console.warn('Failed to read theme', e);
    }
    const initial = stored === 'theme-light' || stored === 'theme-dark' ? stored : 'theme-dark';
    applyTheme(initial);
  })();

  // 初始化收藏列表
  renderFavorites();
})();
