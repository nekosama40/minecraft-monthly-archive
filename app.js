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
    const blocks = Math.round(Number(centimeters || 0) / 100);
    if (blocks < 10000) return `${number.format(blocks)}ブロック`;
    const tenThousands = (blocks / 10000).toLocaleString("ja-JP", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `約${tenThousands}万ブロック`;
  };

  const formatDeathPace = (player) =>
    player.playSeconds <= 36000
      ? `${number.format(player.deaths)}回（実数）`
      : `${Number(player.deathRate10h || 0).toFixed(1)}回 / 10h`;

  const formatMeetingPace = (player) =>
    player.playSeconds <= 36000
      ? `${number.format(player.metCount)}人（実数）`
      : `${Number(player.metRate10h || 0).toFixed(1)}人 / 10h`;

  const formatValue = (player, category) => {
    if (category.key === "playSeconds") return formatDuration(player.playSeconds, true);
    if (category.key === "distanceCm") return formatDistance(player.distanceCm);
    if (category.key === "deathRate10h") return formatDeathPace(player);
    if (category.key === "metRate10h") return formatMeetingPace(player);
    if (category.format === "percent") return `${Number(player[category.key] || 0).toFixed(1)}%`;
    if (category.format === "average") return `平均${Number(player[category.key] || 0).toFixed(2)}人`;
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
    { key: "fishCaught", label: "釣り", description: "期間中に釣り上げた魚の数", unit: "匹" },
    { key: "biomes", label: "バイオーム", description: "訪れたバイオーム数" },
    { key: "points", label: "進捗ポイント", description: "期間中に獲得した進捗ポイント" },
    { key: "combatMobKills", label: "Mob討伐", description: "トラップと短時間の異常増加を除外した推定討伐数", unit: "体" },
    { key: "baseRate", label: "拠点依存率", description: "拠点周辺にいた割合", format: "percent" },
    { key: "expeditionRate", label: "遠征生活率", description: "拠点から5,000ブロック以上、または異世界にいた割合", format: "percent" },
    { key: "undergroundRate", label: "地下生活率", description: "オーバーワールドのY50未満にいた割合", format: "percent" },
    { key: "combatTimeRate", label: "戦闘時間率", description: "本人の討伐・死亡が増えた時間の割合。拠点、トラップ、異常増加は除外", format: "percent" },
    { key: "soloRate", label: "ひとり時間率", description: "256ブロック以内にほかの対象者がいなかった割合", format: "percent" },
    { key: "crowdAverage", label: "にぎやか中心度", description: "100ブロック以内にいた対象者の平均人数", format: "average" },
    { key: "metRate10h", label: "出会いペース", description: "100ブロック以内へ近づいた異なる人数を10時間あたりで比較" },
    { key: "deathRate10h", label: "死亡ペース", description: "プレイ時間の差をならした10時間あたりの死亡回数" },
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
        <h1 id="overview-title">ねこさま Server<br><span>Minecraft Monthly</span></h1>
        <p class="lead">期間限定サーバーで誰がどんな時間を過ごしたのかを、冒険・建築・生活のバランスとともに残した記録です。</p>
        <div class="hero-meta">
          <span class="pill">${esc(data.period.range)}</span>
          <span class="pill">${number.format(data.summary.participantCount)}人が参加</span>
        </div>
      </div>

      <div class="summary-grid" aria-label="サーバー全体の集計">
        <article class="summary-card">
          <span>ユニーク参加者</span>
          <strong>${number.format(data.summary.participantCount)}人</strong>
          <small>ランキング・分析は10時間以上の${number.format(data.summary.eligibleCount)}人</small>
        </article>
        <article class="summary-card">
          <span>分析対象のプレイ時間</span>
          <strong>${formatDuration(data.summary.playSeconds, true)}</strong>
          <small>ランキング対象者の合計</small>
        </article>
        <article class="summary-card distance-card">
          <span>世界を移動した距離</span>
          <strong>${formatDistance(data.summary.distanceCm)}</strong>
          <small>ランキング対象者の合計</small>
        </article>
        <article class="summary-card">
          <span>置かれたブロック</span>
          <strong>${number.format(data.summary.placedBlocks)}</strong>
          <small>建築規模を見るための参考値</small>
        </article>
      </div>

      <nav class="portal-grid" aria-label="詳しい記録を見る">
        <a class="portal-card" href="#rankings">
          <span>01</span><strong>ランキング</strong><small>いろいろな角度から順位を見る</small><em>ランキングを見る <b>→</b></em>
        </a>
        <a class="portal-card" href="#players">
          <span>02</span><strong>プレイヤー図鑑</strong><small>二つ名とプレイスタイルを見る</small><em>図鑑を見る <b>→</b></em>
        </a>
        <a class="portal-card" href="#buildings">
          <span>03</span><strong>建造物</strong><small>この世界に残ったものを見る</small><em>建造物を見る <b>→</b></em>
        </a>
      </nav>

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
        <div class="notice"><strong>位置・戦闘指標について：</strong> 約15分間隔の記録から推定しています。Mob討伐数はトラップ地域と短時間の異常増加を除外しています。</div>
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
        <p class="lead">${esc(category.description)}。</p>
      </header>
      <div class="toolbar">
        <div class="category-tabs" role="tablist" aria-label="ランキングの種類">
          ${rankingCategories.map((item) => `
            <button type="button" role="tab" aria-selected="${item.key === category.key}" class="${item.key === category.key ? "active" : ""}" data-category="${item.key}">
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
      ${category.key === "combatMobKills" ? `<div class="notice">確認済みのトラップ地域に触れた区間と、短時間に異常な増加があった区間を除いた推定値です。約15分間隔の位置記録を使うため、完全な個別キル記録ではありません。</div>` : ""}`;

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
  const playerTag = (player) => player.title || "この世界の住人";

  const renderPlayers = () => {
    const query = playerSearch.trim().toLocaleLowerCase("ja");
    const players = [...data.players]
      .filter((player) => player.name.toLocaleLowerCase("ja").includes(query))
      .sort((a, b) => (b[playerSort] || 0) - (a[playerSort] || 0) || a.name.localeCompare(b.name));
    views.players.innerHTML = `
      <header class="page-title">
        <p class="eyebrow">Players</p>
        <h1 id="players-title">プレイヤー</h1>
        <p class="lead">プレイヤーごとの二つ名と「この1か月の遊び方」を見られます。</p>
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
                <span>${esc(player.highlight?.label || "特徴")}<strong>${esc(player.highlight?.value || "—")}</strong></span>
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

  const radarSvg = (radar, medianRadar = {}) => {
    const labels = Object.keys(radar);
    const values = Object.values(radar).map(Number);
    const medianValues = labels.map((label) => Number(medianRadar[label] ?? 50));
    const center = 170;
    const radius = 112;
    const angle = (index) => -Math.PI / 2 + index * (Math.PI * 2 / labels.length);
    const point = (index, scale) => {
      const a = angle(index);
      return [center + Math.cos(a) * radius * scale, center + Math.sin(a) * radius * scale];
    };
    const points = (scale) => labels.map((_, index) => point(index, scale).join(",")).join(" ");
    const valuePoints = values.map((value, index) => point(index, Math.max(0, Math.min(100, value)) / 100).join(",")).join(" ");
    const medianPoints = medianValues.map((value, index) => point(index, Math.max(0, Math.min(100, value)) / 100).join(",")).join(" ");

    return `
      <svg class="radar-svg" viewBox="0 0 340 340" role="img" aria-label="プレイスタイルのレーダーチャート">
        ${[.25, .5, .75, 1].map((scale) => `<polygon points="${points(scale)}" fill="${scale === 1 ? "#f8faf7" : "none"}" stroke="#d9e0da" stroke-width="1"/>`).join("")}
        ${labels.map((_, index) => {
          const [x, y] = point(index, 1);
          return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#d9e0da" stroke-width="1"/>`;
        }).join("")}
        <polygon points="${medianPoints}" fill="none" stroke="#d5a72d" stroke-width="2" stroke-dasharray="5 5"/>
        <polygon points="${valuePoints}" fill="rgba(46,117,82,.25)" stroke="#2e7552" stroke-width="3"/>
        ${values.map((value, index) => {
          const [x, y] = point(index, Math.max(0, Math.min(100, value)) / 100);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#2e7552"/>`;
        }).join("")}
        ${labels.map((label, index) => {
           const [x, y] = point(index, 1.22);
           const anchor = x < center - 10 ? "end" : x > center + 10 ? "start" : "middle";
           return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" fill="#59675f" font-size="12" font-weight="700">${esc(label)} <tspan fill="#173c2c" font-size="14">${Math.round(values[index])}</tspan></text>`;
         }).join("")}
         <text x="170" y="327" text-anchor="middle" fill="#9a7620" font-size="10">黄色の点線＝サーバー中央値</text>
       </svg>`;
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
      ["死亡ペース", formatDeathPace(player)],
      ["Mob討伐（トラップ・異常増加除外）", number.format(player.combatMobKills)],
    ];
    views.player.innerHTML = `
      <button class="back-button" type="button" data-back>← プレイヤー一覧</button>
      <div class="profile-layout section-block">
        <aside class="panel profile-aside">
           <img class="profile-body" src="${esc(player.body)}" alt="${esc(player.name)} のスキン全身">
           <h1 id="player-title">${esc(player.name)}</h1>
           <div class="big-time"><small>1か月のプレイ時間</small>${formatDuration(player.playSeconds, true)}</div>
        </aside>
        <div class="profile-content">
          <div class="profile-top-grid">
            <article class="panel">
              <p class="eyebrow">Play Style</p>
              <h2>プレイスタイル</h2>
              <div class="radar-wrap">${radarSvg(player.radar, data.analytics.radarMedian)}</div>
             </article>
             <article class="panel style-profile">
               <p class="eyebrow">Your Play Style</p>
               <h2>あなたのプレイスタイル</h2>
               <span class="style-type">${esc(player.styleType || "プレイヤータイプ")}</span>
               <div class="title-block">
                 <small>二つ名</small>
                 <strong>${esc(playerTag(player))}</strong>
               </div>
               <p class="style-story">${esc(player.styleText || "この世界での行動から、あなたらしい遊び方を読み解きました。")}</p>
             </article>
          </div>
          <article class="panel">
             <p class="eyebrow">One-Month Record</p>
            <h2>この1か月の記録</h2>
            <div class="detail-grid">
              ${details.map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("")}
            </div>
          </article>
          ${renderStory(player)}
           <div class="notice">レーダーは対象者内での相対的な特徴を0～100で表し、黄色の点線を中央値としています。採掘・建築・生活・Mob討伐は10時間あたり、進捗は期間中の総ポイントで比較し、位置・交流・戦闘は約15分間隔の記録から推定しています。</div>
        </div>
      </div>`;
    views.player.querySelector("[data-back]").addEventListener("click", () => {
      location.hash = "players";
    });
  };

  const renderStory = (player) => {
    const normalRate = Math.max(0, 100 - player.baseRate - player.expeditionRate);
    const pairText = player.bestPair
      ? `${esc(player.bestPair.partner_name)} / 同行度 ${Number(player.bestPair.score).toFixed(0)}%`
      : "該当なし";
    return `
    <article class="panel">
      <p class="eyebrow">Location & Social Story</p>
      <h2>居場所とつながり</h2>
      <p class="lead">約15分間隔の位置記録から、拠点・遠征・地下での過ごし方と、ほかのプレイヤーとの距離を読み解きました。</p>
      <div class="share-bar" aria-label="場所別の滞在割合">
        <span style="width:${player.baseRate}%"></span>
        <span style="width:${normalRate}%"></span>
        <span style="width:${player.expeditionRate}%"></span>
      </div>
      <div class="share-labels">
        <span><i style="background:#2e7552"></i>拠点周辺 ${player.baseRate}%</span>
        <span><i style="background:#65b8b1"></i>通常圏 ${normalRate.toFixed(1)}%</span>
        <span><i style="background:#d47b3f"></i>遠征 ${player.expeditionRate}%</span>
      </div>
      <div class="detail-grid section-block">
        <div class="detail-item"><span>拠点依存率</span><strong>${player.baseRate}%</strong></div>
        <div class="detail-item"><span>遠征生活率</span><strong>${player.expeditionRate}%</strong></div>
        <div class="detail-item"><span>地下生活率</span><strong>${player.undergroundRate}%</strong></div>
        <div class="detail-item"><span>戦闘時間率</span><strong>${player.combatTimeRate}%</strong></div>
        <div class="detail-item"><span>ひとり時間率</span><strong>${player.soloRate}%</strong></div>
        <div class="detail-item"><span>近くにいた平均人数</span><strong>${Number(player.crowdAverage).toFixed(2)}人</strong></div>
        <div class="detail-item"><span>出会いペース</span><strong>${formatMeetingPace(player)}</strong></div>
        <div class="detail-item"><span>観測したチャンク</span><strong>${number.format(player.observedChunks)}</strong></div>
        <div class="detail-item"><span>ベストパートナー</span><strong>${pairText}</strong></div>
      </div>
      <p class="metric-note">拠点は半径${number.format(data.analytics.baseRadius)}ブロック、遠征は${number.format(data.analytics.expeditionRadius)}ブロック以上またはネザー・エンド、地下はオーバーワールドY${data.analytics.undergroundY}未満です。戦闘時間率は本人の討伐・死亡が増えた時間だけを数え、拠点・トラップ・異常増加を除外しています。ベストパートナーは${number.format(data.analytics.pairMinCloseHours)}時間以上近くにいた相手から選び、近いほど強く、拠点内は半分、拠点外で続いた同行は強めに評価します。</p>
    </article>`;
  };

  const renderBuildings = () => {
    views.buildings.innerHTML = `
      <header class="page-title">
        <p class="eyebrow">Buildings</p>
        <h1 id="buildings-title">建造物</h1>
        <p class="lead">完成後は、建築写真・作者・場所・ひとことをまとめたギャラリーにできます。現在の集計表に建築情報がないため、下はレイアウトの表示例です。</p>
      </header>
      <div class="building-intro">
        <article class="panel">
          <h2>建築も「この1か月の物語」に</h2>
          <p class="lead">数値だけでは残りにくい共同建築やお気に入りの場所を、発表の最後に一覧で見せる想定です。スクリーンショットがあれば、そのままカードの大きな画像に差し替えられます。</p>
        </article>
        <article class="panel">
          <h3>追加時にほしい情報</h3>
          <div class="field-list">
            <span>建築名</span><span>スクリーンショット</span><span>作者</span><span>エリア名</span><span>完成日</span><span>紹介文</span>
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

  document.querySelector("#updated-at").textContent = `データ取得：${data.snapshot.displayDate}`;
  window.addEventListener("hashchange", route);
  route();
})();
