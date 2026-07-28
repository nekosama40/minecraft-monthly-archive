(() => {
  "use strict";

  const data = window.MC_STATS_DATA;
  const views = {
    overview: document.querySelector("#overview-view"),
    rankings: document.querySelector("#rankings-view"),
    players: document.querySelector("#players-view"),
    player: document.querySelector("#player-view"),
    buildings: document.querySelector("#buildings-view"),
  };

  if (!data || !Array.isArray(data.players)) {
    views.overview.innerHTML = `
      <div class="empty">
        <h1>データを読み込めませんでした</h1>
        <p>data.js が同じフォルダーにあるか確認してください。</p>
      </div>`;
    return;
  }

  const number = new Intl.NumberFormat("ja-JP");
  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const sum = (key) => data.players.reduce((total, player) => total + Number(player[key] || 0), 0);

  const formatDuration = (seconds, compact = false) => {
    const minutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    if (compact) return hours ? `${number.format(hours)}時間${remain ? `${remain}分` : ""}` : `${remain}分`;
    return `${number.format(hours)}時間 ${remain}分`;
  };

  const formatDistance = (centimeters) => {
    const kilometers = Number(centimeters || 0) / 100000;
    return kilometers >= 1000
      ? `${number.format(Math.round(kilometers))} km`
      : `${kilometers.toLocaleString("ja-JP", { maximumFractionDigits: 1 })} km`;
  };

  const formatValue = (player, category) => {
    if (category.key === "playSeconds") return formatDuration(player.playSeconds, true);
    if (category.key === "distanceCm") return formatDistance(player.distanceCm);
    return `${number.format(player[category.key] || 0)}${category.unit || ""}`;
  };

  const avatar = (player) =>
    `<img class="rank-avatar" src="${esc(player.avatar)}" alt="${esc(player.name)} のスキン">`;

  const rankingCategories = [
    { key: "playSeconds", label: "プレイ時間", description: "この期間にサーバーで過ごした時間" },
    { key: "distanceCm", label: "移動距離", description: "歩行・飛行などを含む総移動距離" },
    { key: "minedBlocks", label: "採掘", description: "採掘したブロック数" },
    { key: "placedBlocks", label: "設置", description: "設置したブロック数" },
    { key: "harvestedCrops", label: "収穫", description: "収穫した作物数" },
    { key: "biomes", label: "バイオーム", description: "訪れたバイオーム数" },
    { key: "points", label: "進捗ポイント", description: "集計中の進捗ポイント" },
    { key: "mobKills", label: "Mob討伐（参考）", description: "トラップタワーの影響を含むため参考値" },
  ];

  const getRanking = (key) =>
    [...data.players].sort((a, b) => (b[key] || 0) - (a[key] || 0) || a.name.localeCompare(b.name));

  const playerById = (id) => data.players.find((player) => player.id === id);

  const profileLink = (player) => {
    location.hash = `player=${encodeURIComponent(player.id)}`;
  };

  const renderOverview = () => {
    const topTime = getRanking("playSeconds")[0];
    const topTravel = getRanking("distanceCm")[0];
    const topBuild = getRanking("placedBlocks")[0];
    const actionTotals = [
      { label: "採掘", value: sum("minedBlocks") },
      { label: "ブロック設置", value: sum("placedBlocks") },
      { label: "作物収穫", value: sum("harvestedCrops") },
      { label: "木材伐採", value: sum("logsChopped") },
      { label: "照明設置", value: sum("lights") },
      { label: "釣り", value: sum("fishCaught") },
    ];
    const maxAction = Math.max(...actionTotals.map((item) => item.value), 1);
    const spotlights = [
      { player: topTime, note: `最長プレイ ${formatDuration(topTime.playSeconds, true)}` },
      { player: topTravel, note: `最長移動 ${formatDistance(topTravel.distanceCm)}` },
      { player: topBuild, note: `最多設置 ${number.format(topBuild.placedBlocks)} ブロック` },
    ];

    views.overview.innerHTML = `
      <div class="hero">
        <p class="eyebrow">One-Month Server Archive</p>
        <h1 id="overview-title">1か月だけ存在した<br>この世界の記録</h1>
        <p class="lead">期間限定サーバーで誰がどんな時間を過ごしたのかを、探索・建築・生活のバランスとともに残した記録です。</p>
        <div class="hero-meta">
          <span class="pill">${esc(data.period.label)}</span>
          <span class="pill">${number.format(data.summary.playerCount)}人が参加</span>
          <span class="pill">${esc(data.snapshot.label)}</span>
        </div>
      </div>

      <div class="summary-grid" aria-label="サーバー全体の集計">
        <article class="summary-card">
          <span>参加プレイヤー</span>
          <strong>${number.format(data.summary.playerCount)}人</strong>
          <small>集計対象になったユニーク人数</small>
        </article>
        <article class="summary-card">
          <span>みんなのプレイ時間</span>
          <strong>${formatDuration(data.summary.playSeconds, true)}</strong>
          <small>全プレイヤーの合計</small>
        </article>
        <article class="summary-card">
          <span>世界を移動した距離</span>
          <strong>${formatDistance(data.summary.distanceCm)}</strong>
          <small>徒歩・飛行などを含む総距離</small>
        </article>
        <article class="summary-card">
          <span>置かれたブロック</span>
          <strong>${number.format(data.summary.placedBlocks)}</strong>
          <small>建築規模を見るための参考値</small>
        </article>
      </div>

      <section class="section-block">
        <div class="section-heading">
          <h2>この世界を数字で振り返る</h2>
          <p>1か月の遊び方をまとめた記録です</p>
        </div>
        <div class="overview-grid">
          <article class="panel">
            <p class="eyebrow">Action Mix</p>
            <h3>みんなは何をしていた？</h3>
            <div class="metric-list">
              ${actionTotals.map((item) => `
                <div class="metric-row">
                  <span>${item.label}</span>
                  <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${Math.max(2, item.value / maxAction * 100)}%"></div></div>
                  <strong>${number.format(item.value)}</strong>
                </div>`).join("")}
            </div>
          </article>
          <article class="panel">
            <p class="eyebrow">Spotlight</p>
            <h3>ひときわ目立ったプレイヤー</h3>
            <div class="spotlight-list">
              ${spotlights.map(({ player, note }) => `
                <button class="spotlight" type="button" data-player="${esc(player.id)}">
                  <img src="${esc(player.avatar)}" alt="">
                  <div><b>${esc(player.name)}</b><small>${esc(note)}</small></div>
                  <span aria-hidden="true">›</span>
                </button>`).join("")}
            </div>
          </article>
        </div>
        <div class="notice"><strong>Mob討伐数について：</strong> トラップタワーの利用で大きく伸びるため、プレイスタイルのレーダーには使っていません。ランキングでは参考値として分けて表示します。</div>
      </section>`;

    views.overview.querySelectorAll("[data-player]").forEach((button) => {
      button.addEventListener("click", () => profileLink(playerById(button.dataset.player)));
    });
  };

  let activeRanking = "playSeconds";
  const renderRankings = () => {
    const category = rankingCategories.find((item) => item.key === activeRanking) || rankingCategories[0];
    const ranking = getRanking(category.key);
    const maximum = Math.max(ranking[0]?.[category.key] || 0, 1);
    views.rankings.innerHTML = `
      <header class="page-title">
        <p class="eyebrow">Rankings</p>
        <h1 id="rankings-title">ランキング</h1>
        <p class="lead">${esc(category.description)}。名前を選ぶと、その人のプロフィールを見られます。</p>
      </header>
      <div class="toolbar">
        <div class="category-tabs" role="tablist" aria-label="ランキングの種類">
          ${rankingCategories.map((item) => `
            <button type="button" class="${item.key === category.key ? "active" : ""}" data-category="${item.key}">
              ${esc(item.label)}
            </button>`).join("")}
        </div>
      </div>
      <div class="ranking-list">
        ${ranking.map((player, index) => `
          <div class="ranking-row" role="link" tabindex="0" data-player="${esc(player.id)}">
            <span class="rank-number">${index + 1}</span>
            ${avatar(player)}
            <span class="rank-name">${esc(player.name)}</span>
            <div class="rank-bar" aria-hidden="true"><span style="width:${Math.max(1.5, (player[category.key] || 0) / maximum * 100)}%"></span></div>
            <span class="rank-value">${formatValue(player, category)}</span>
          </div>`).join("")}
      </div>
      ${category.key === "mobKills" ? `<div class="notice">トラップタワー内の討伐も合算されています。この順位だけで戦闘スタイルを判断しない想定です。</div>` : ""}`;

    views.rankings.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeRanking = button.dataset.category;
        renderRankings();
      });
    });
    bindPlayerLinks(views.rankings);
  };

  let playerSearch = "";
  let playerSort = "playSeconds";
  const playerTag = (player) => {
    const axes = Object.entries(player.radar);
    const best = axes.sort((a, b) => b[1] - a[1])[0]?.[0] || "活動量";
    return `${best}タイプ`;
  };

  const renderPlayers = () => {
    const query = playerSearch.trim().toLocaleLowerCase("ja");
    const players = [...data.players]
      .filter((player) => player.name.toLocaleLowerCase("ja").includes(query))
      .sort((a, b) => (b[playerSort] || 0) - (a[playerSort] || 0) || a.name.localeCompare(b.name));
    views.players.innerHTML = `
      <header class="page-title">
        <p class="eyebrow">Players</p>
        <h1 id="players-title">プレイヤー</h1>
        <p class="lead">スキンと活動データから、全員の「この1か月の遊び方」を見られます。</p>
      </header>
      <div class="search-row">
        <input class="search-input" type="search" value="${esc(playerSearch)}" placeholder="プレイヤー名で検索" aria-label="プレイヤー名で検索">
        <select class="sort-select" aria-label="並び順">
          <option value="playSeconds" ${playerSort === "playSeconds" ? "selected" : ""}>プレイ時間順</option>
          <option value="points" ${playerSort === "points" ? "selected" : ""}>進捗ポイント順</option>
          <option value="distanceCm" ${playerSort === "distanceCm" ? "selected" : ""}>移動距離順</option>
          <option value="placedBlocks" ${playerSort === "placedBlocks" ? "selected" : ""}>設置数順</option>
        </select>
      </div>
      ${players.length ? `
        <div class="players-grid">
          ${players.map((player) => `
            <article class="player-card" role="link" tabindex="0" data-player="${esc(player.id)}">
              <div class="player-card-head">
                <img class="player-avatar" src="${esc(player.avatar)}" alt="${esc(player.name)} のスキン">
                <div>
                  <h3>${esc(player.name)}</h3>
                  <span class="tag">${esc(playerTag(player))}</span>
                </div>
              </div>
              <div class="player-card-stats">
                <span>プレイ時間<strong>${formatDuration(player.playSeconds, true)}</strong></span>
                <span>移動距離<strong>${formatDistance(player.distanceCm)}</strong></span>
              </div>
            </article>`).join("")}
        </div>` : `<div class="empty">「${esc(playerSearch)}」に一致するプレイヤーはいません。</div>`}`;

    const search = views.players.querySelector(".search-input");
    search.addEventListener("input", (event) => {
      playerSearch = event.target.value;
      renderPlayers();
      const nextSearch = views.players.querySelector(".search-input");
      nextSearch.focus();
      nextSearch.setSelectionRange(playerSearch.length, playerSearch.length);
    });
    views.players.querySelector(".sort-select").addEventListener("change", (event) => {
      playerSort = event.target.value;
      renderPlayers();
    });
    bindPlayerLinks(views.players);
  };

  const radarSvg = (radar) => {
    const labels = Object.keys(radar);
    const values = Object.values(radar).map(Number);
    const center = 170;
    const radius = 112;
    const angle = (index) => -Math.PI / 2 + index * (Math.PI * 2 / labels.length);
    const point = (index, scale) => {
      const a = angle(index);
      return [center + Math.cos(a) * radius * scale, center + Math.sin(a) * radius * scale];
    };
    const points = (scale) => labels.map((_, index) => point(index, scale).join(",")).join(" ");
    const valuePoints = values.map((value, index) => point(index, Math.max(0, Math.min(100, value)) / 100).join(",")).join(" ");

    return `
      <svg class="radar-svg" viewBox="0 0 340 340" role="img" aria-label="プレイスタイルのレーダーチャート">
        ${[.25, .5, .75, 1].map((scale) => `<polygon points="${points(scale)}" fill="${scale === 1 ? "#f8faf7" : "none"}" stroke="#d9e0da" stroke-width="1"/>`).join("")}
        ${labels.map((_, index) => {
          const [x, y] = point(index, 1);
          return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#d9e0da" stroke-width="1"/>`;
        }).join("")}
        <polygon points="${valuePoints}" fill="rgba(46,117,82,.25)" stroke="#2e7552" stroke-width="3"/>
        ${values.map((value, index) => {
          const [x, y] = point(index, Math.max(0, Math.min(100, value)) / 100);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#2e7552"/>`;
        }).join("")}
        ${labels.map((label, index) => {
          const [x, y] = point(index, 1.22);
          const anchor = x < center - 10 ? "end" : x > center + 10 ? "start" : "middle";
          return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" fill="#59675f" font-size="12" font-weight="700">${esc(label)}</text>`;
        }).join("")}
      </svg>`;
  };

  const profileSummary = (player) => {
    const axes = Object.entries(player.radar).sort((a, b) => b[1] - a[1]);
    const first = axes[0]?.[0] || "活動量";
    const second = axes[1]?.[0] || "探索";
    return `この1か月の ${player.name} は、特に「${first}」が際立つプレイスタイルでした。「${second}」も高く、${formatDuration(player.playSeconds, true)}の中で ${formatDistance(player.distanceCm)} を移動しています。`;
  };

  const renderPlayer = (id) => {
    const player = playerById(id);
    if (!player) {
      views.player.innerHTML = `<div class="empty"><h1>プレイヤーが見つかりません</h1><a href="#players">一覧へ戻る</a></div>`;
      return;
    }
    const details = [
      ["移動距離", formatDistance(player.distanceCm)],
      ["採掘", number.format(player.minedBlocks)],
      ["ブロック設置", number.format(player.placedBlocks)],
      ["作物収穫", number.format(player.harvestedCrops)],
      ["照明設置", number.format(player.lights)],
      ["バイオーム", `${number.format(player.biomes)}種`],
      ["木材伐採", number.format(player.logsChopped)],
      ["釣り", number.format(player.fishCaught)],
      ["進捗ポイント", number.format(player.points)],
      ["死亡回数", number.format(player.deaths)],
      ["Mob討伐（参考）", number.format(player.mobKills)],
    ];
    views.player.innerHTML = `
      <button class="back-button" type="button" data-back>← プレイヤー一覧</button>
      <div class="profile-layout section-block">
        <aside class="panel profile-aside">
          <img class="profile-body" src="${esc(player.body)}" alt="${esc(player.name)} のスキン全身">
          <h1 id="player-title">${esc(player.name)}</h1>
          <span class="tag">${esc(playerTag(player))}</span>
          <div class="big-time"><small>1か月のプレイ時間</small>${formatDuration(player.playSeconds, true)}</div>
        </aside>
        <div class="profile-content">
          <div class="profile-top-grid">
            <article class="panel">
              <p class="eyebrow">Play Style</p>
              <h2>プレイスタイル</h2>
              <div class="radar-wrap">${radarSvg(player.radar)}</div>
            </article>
            <article class="panel">
              <p class="eyebrow">Relative Score</p>
              <h2>みんなの中での特徴</h2>
              <div class="score-list">
                ${Object.entries(player.radar).map(([label, value]) => `
                  <div class="score-row">
                    <span>${esc(label)}</span>
                    <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${value}%"></div></div>
                    <b>${Math.round(value)}</b>
                  </div>`).join("")}
              </div>
              <p class="profile-summary">${esc(profileSummary(player))}</p>
            </article>
          </div>
          <article class="panel">
            <p class="eyebrow">Monthly Record</p>
            <h2>この1か月の記録</h2>
            <div class="detail-grid">
              ${details.map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("")}
            </div>
          </article>
          ${player.extra ? renderExtra(player.extra) : ""}
          <div class="notice">レーダーは参加者内での相対値です。Mob討伐数はトラップタワーの影響が大きいため計算から除外しています。</div>
        </div>
      </div>`;
    views.player.querySelector("[data-back]").addEventListener("click", () => {
      location.hash = "players";
    });
  };

  const renderExtra = (extra) => `
    <article class="panel">
      <p class="eyebrow">Location Story — Detailed Sample</p>
      <h2>居場所から見える過ごし方</h2>
      <p class="lead">位置履歴まで使えるプレイヤーの詳細表示例です。拠点周辺・通常探索・特殊行動の滞在比率を一つの物語として見せます。</p>
      <div class="share-bar" aria-label="場所別の滞在割合">
        <span style="width:${extra.locationShares.base}%"></span>
        <span style="width:${extra.locationShares.exploration}%"></span>
        <span style="width:${extra.locationShares.special}%"></span>
      </div>
      <div class="share-labels">
        <span><i style="background:#2e7552"></i>拠点周辺 ${extra.locationShares.base}%</span>
        <span><i style="background:#65b8b1"></i>通常探索 ${extra.locationShares.exploration}%</span>
        <span><i style="background:#d47b3f"></i>特殊行動地点 ${extra.locationShares.special}%</span>
      </div>
      <div class="detail-grid section-block">
        <div class="detail-item"><span>オーバーワールド</span><strong>${extra.dimensions.overworld}%</strong></div>
        <div class="detail-item"><span>ネザー</span><strong>${extra.dimensions.nether}%</strong></div>
        <div class="detail-item"><span>エンド</span><strong>${extra.dimensions.end}%</strong></div>
        <div class="detail-item"><span>観測した区画</span><strong>${number.format(extra.observedChunks)}</strong></div>
        <div class="detail-item"><span>行動半径 R80</span><strong>${number.format(extra.radius80)} m</strong></div>
        <div class="detail-item"><span>特殊地点での討伐割合</span><strong>${extra.specialKillShare}%</strong></div>
      </div>
    </article>`;

  const renderBuildings = () => {
    views.buildings.innerHTML = `
      <header class="page-title">
        <p class="eyebrow">Buildings</p>
        <h1 id="buildings-title">建築物</h1>
        <p class="lead">完成後は、建築写真・作者・場所・ひとことをまとめたギャラリーにできます。現在の集計表に建築情報がないため、下はレイアウトの表示例です。</p>
      </header>
      <div class="building-intro">
        <article class="panel">
          <h2>建築も「今月の物語」に</h2>
          <p class="lead">数値だけでは残りにくい共同建築やお気に入りの場所を、発表の最後に一覧で見せる想定です。スクリーンショットがあれば、そのままカードの大きな画像に差し替えられます。</p>
        </article>
        <article class="panel">
          <h3>追加時にほしい情報</h3>
          <div class="field-list">
            <span>建築名</span><span>スクリーンショット</span><span>作者</span><span>座標</span><span>完成日</span><span>紹介文</span>
          </div>
        </article>
      </div>
      <div class="building-grid">
        ${data.buildings.map((building) => `
          <article class="building-card">
            <div class="building-image ${esc(building.theme)}">
              <span class="demo-badge">表示例</span>
            </div>
            <div class="building-body">
              <span class="tag">${esc(building.type)}</span>
              <h3>${esc(building.name)}</h3>
              <p>${esc(building.description)}</p>
              <div class="field-list"><span>作者：${esc(building.author)}</span><span>場所：${esc(building.location)}</span></div>
            </div>
          </article>`).join("")}
      </div>
      <div class="notice">ここに表示している建築名・作者・場所はすべて表示例です。実際の建築データをいただいた段階で差し替えます。</div>`;
  };

  const bindPlayerLinks = (container) => {
    container.querySelectorAll("[data-player]").forEach((element) => {
      const open = () => {
        const player = playerById(element.dataset.player);
        if (player) profileLink(player);
      };
      element.addEventListener("click", open);
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  };

  const route = () => {
    const raw = location.hash.replace(/^#/, "") || "overview";
    const [page, value] = raw.split("=");
    const activeView = page === "player" ? "player" : views[page] ? page : "overview";
    Object.entries(views).forEach(([name, element]) => {
      element.hidden = name !== activeView;
    });
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === (activeView === "player" ? "players" : activeView));
    });
    if (activeView === "overview") renderOverview();
    if (activeView === "rankings") renderRankings();
    if (activeView === "players") renderPlayers();
    if (activeView === "player") renderPlayer(decodeURIComponent(value || ""));
    if (activeView === "buildings") renderBuildings();
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  document.querySelector("#updated-at").textContent = `データ更新：${data.snapshot.displayDate}`;
  window.addEventListener("hashchange", route);
  route();
})();
