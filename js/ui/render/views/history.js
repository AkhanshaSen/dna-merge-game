import { FORECAST_WIN_ACCURACY } from '../../../core/constants.js';
import { game } from '../../../core/state.js';
import { scoreColor } from '../../../core/game-logic.js';
import { buildHistorySections, formatHistoryTs, stageFromRow } from '../../../content/history-groups.js';

function sparklineFromLog() {
  const log = game.ST.log || [];
  const recent = log.slice(-12);
  if (!recent.length) return '';
  const pts = recent.map((l) => {
    const pt = l.detail?.match(/pts ([+-]?\d+)/);
    return pt ? Math.abs(parseInt(pt[1], 10)) : l.out === 'survive' ? 10 : 5;
  });
  const max = Math.max(...pts, 1);
  const bars = pts
    .map((v) => `<div class="spark-bar" style="height:${Math.round((v / max) * 100)}%"></div>`)
    .join('');
  return `<div class="sparkline" title="Recent stage outcomes">${bars}</div>`;
}

function historyForecastRow(p) {
  const ts = p.ts ? `<span class="history-ts">${formatHistoryTs(p.ts)}</span>` : '';
  return `<div class="hrow">
    <span>${p.ok ? '✅' : '❌'}</span>
    <div class="hrow-info">
      <div class="hrow-nm">${p.name}${ts}</div>
      <div class="hrow-dt">Predicted: ${p.pred} · Actual: ${p.actual}${typeof p.pts === 'number' ? ` · pts ${p.pts > 0 ? '+' : ''}${p.pts}` : ''}</div>
    </div>
  </div>`;
}

function historyLogRow(l) {
  const oc = l.out === 'survive' ? 'var(--green)' : l.out === 'damage' ? 'var(--amber)' : 'var(--red)';
  const stage = stageFromRow(l);
  const ts = l.ts ? `<span class="history-ts">${formatHistoryTs(l.ts)}</span>` : '';
  return `<div class="lrow">
    <div class="lnm">${l.name} — Stage ${stage}${ts}</div>
    <div class="ldt">${l.event} → <strong class="outcome-dynamic" style="color:${oc}">${l.out}</strong>${l.res && l.res !== 'None' ? ' · ' + l.res : ''}</div>
  </div>`;
}

function historyCrossBlock(crossIndex, preds, logs, crossResults) {
  const pr = preds || [];
  const lg = logs || [];
  if (!pr.length && !lg.length) return '';
  const cr = (crossResults || []).find((r) => r.crossIndex === crossIndex);
  const tierNote = cr
    ? `<span class="history-cross-tier">${cr.fullLife ? 'Full natural life' : cr.tier === 'extinct' ? 'Extinct' : cr.tier === 'woundedEnd' ? 'Collapsed at old age' : cr.tier === 'partialArc' ? 'Arc finished' : 'Cross ended'}</span>`
    : '';
  const forecastHtml = pr.length
    ? pr.map(historyForecastRow).join('')
    : `<p class="history-cross-empty">No forecasts this cross.</p>`;
  const logHtml = lg.length ? lg.map(historyLogRow).join('') : '';
  return `<div class="history-cross-block">
    <div class="history-cross-hdr">Cross ${crossIndex}${tierNote}</div>
    <div class="history-cross-lbl">Forecasts</div>
    ${forecastHtml}
    ${logHtml ? `<div class="history-cross-lbl">Life stages</div>${logHtml}` : ''}
  </div>`;
}

function historyGameCard(section) {
  const pct = section.forecastPct ?? 0;
  const total = section.forecastTotal ?? 0;
  const correct = section.forecastCorrect ?? 0;
  const started = section.startedAt ? formatHistoryTs(section.startedAt) : '—';
  const ended = section.inProgress ? 'In progress' : section.completedAt ? formatHistoryTs(section.completedAt) : '—';
  const verdict =
    !section.inProgress && total > 0
      ? section.isWinner
        ? '<span class="history-verdict history-verdict-win">Winner</span>'
        : '<span class="history-verdict history-verdict-lose">Loser</span>'
      : '';
  const imperfect = (section.partialArc || 0) + (section.woundedEnd || 0);
  const pills = `<div class="history-game-pills">
    <span class="round-cross-pill round-cross-pill-good">${section.fullLife || 0} full life</span>
    <span class="round-cross-pill round-cross-pill-warn">${imperfect} imperfect</span>
    <span class="round-cross-pill round-cross-pill-bad">${section.extinct || 0} extinct</span>
  </div>`;
  const crossHtml = [1, 2, 3]
    .map((c) =>
      historyCrossBlock(
        c,
        section.predictionsByCross?.[c],
        section.logByCross?.[c],
        section.crossResults,
      ),
    )
    .join('');
  return `<div class="card anim-up history-game-card">
    <div class="history-game-hdr">
      <div class="history-game-title">Game ${section.gameNumber}${section.inProgress ? ' <span class="history-in-progress">· live</span>' : ''}</div>
      <div class="history-game-meta">Started ${started}${section.inProgress ? '' : ` · Completed ${ended}`}</div>
    </div>
    <div class="acc-bar-wrap ratew">
      <div class="rateh">
        <span class="ratel">Guess-to-reality</span>
        <span class="ratep" style="color:${scoreColor(pct)}">${total ? `${pct}%` : '—'}</span>
        ${verdict}
      </div>
      <div class="ratetr"><div class="ratefill" style="width:${pct}%;background:${scoreColor(pct)}"></div></div>
      <div class="history-game-sub">${total ? `${correct}/${total} forecasts matched` : 'No forecasts yet'}</div>
    </div>
    ${pills}
    <div class="history-game-body">${crossHtml || '<p class="history-cross-empty">No stage data yet for this game.</p>'}</div>
  </div>`;
}

function historyLegacyCard(legacy) {
  const pRows = legacy.predictions.length
    ? legacy.predictions.map(historyForecastRow).join('')
    : `<div class="empty"><span class="eic">🔮</span><div class="etx">No legacy forecasts</div></div>`;
  const lRows = legacy.log.length
    ? legacy.log.map(historyLogRow).join('')
    : `<div class="empty"><span class="eic">📋</span><div class="etx">No legacy log entries</div></div>`;
  return `<div class="card anim-up history-legacy">
    <div class="ctitle">📦 Earlier sessions</div>
    <p class="history-legacy-note">Records from before game grouping — no dates attached.</p>
    <div class="div">Forecasts</div>
    <div class="history-scroll">${pRows}</div>
    <div class="div">Life-stage log</div>
    <div class="history-scroll history-scroll-lg">${lRows}</div>
  </div>`;
}

export function renderHistory(m) {
  const { lifetime, games, legacy } = buildHistorySections(game.ST, game);
  const acc = lifetime.pct;
  const hasLegacy = legacy && (legacy.predictions.length || legacy.log.length);

  const lifetimeCard = `<div class="card anim-up">
    <div class="ctitle">🔮 Lifetime guess-to-reality</div>
    ${
      lifetime.total
        ? `<div class="acc-bar-wrap ratew">
      <div class="rateh"><span class="ratel">All games</span><span class="ratep" style="color:${scoreColor(acc)}">${acc}%</span></div>
      <div class="ratetr"><div class="ratefill" style="width:${acc}%;background:${scoreColor(acc)}"></div></div>
      <div class="history-game-sub">${lifetime.correct}/${lifetime.total} forecasts matched${hasLegacy ? ' · includes earlier sessions' : ''}</div>
    </div>`
        : `<div class="empty"><span class="eic">🔮</span><div class="etx">No forecasts logged yet</div></div>`
    }
    ${lifetime.total ? sparklineFromLog() : ''}
    <p class="history-hint">Per-game winner needs <strong>&gt;${FORECAST_WIN_ACCURACY}%</strong> guess-to-reality and at least one full-life cross.</p>
  </div>`;

  const gameCards = games.length ? games.map(historyGameCard).join('') : '';
  const legacyCard = legacy ? historyLegacyCard(legacy) : '';

  m.innerHTML = `${lifetimeCard}${gameCards}${legacyCard}`;
}