// recommend-ui.jsx — "Styled for you" panel for the Build screen.
// Renders the V1 engine's ranked suggestions with explanations.
// Exposes window.RecoPanel. Requires window.SS_RECO (recommend.js).

const { useState: uSReco, useMemo: uMReco } = React;

const RECO_OCCASIONS = [
  { key: 'casual', label: 'Casual' },
  { key: 'formal', label: 'Formal' },
  { key: 'sports', label: 'Sports' },
];

function RecoPanel({ wardrobe, favorites, onApply, compact }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const Eyebrow = window.Eyebrow;

  const [occasion, setOccasion] = uSReco('casual');
  const [result, setResult] = uSReco(null);
  const [ran, setRan] = uSReco(false);

  const SLOT_KEYS = ['outerwear', 'top', 'bottom', 'shoes'];

  function run(occ) {
    const target = occ || occasion;
    const res = window.SS_RECO ? window.SS_RECO.recommend(wardrobe, target, { limit: 4 }) : { outfits: [] };
    setResult(res);
    setRan(true);
  }

  const outfits = (result && result.outfits) || [];
  const notEnough = ran && result && result.reason === 'need_top_and_bottom';

  return (
    <div style={{
      background: C.paper, border: `1px solid ${C.line}`,
      borderRadius: R.r2, padding: compact ? 16 : 20,
      display: 'grid', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Eyebrow>Styled for you</Eyebrow>
        <span style={{ fontFamily: FN, fontSize: 11, color: C.muted }}>rule-based · explainable</span>
      </div>

      <div style={{
        fontFamily: FS, fontStyle: 'italic', fontSize: compact ? 16 : 18,
        color: C.ink, lineHeight: 1.3, marginTop: -4,
      }}>Pick an occasion and we'll assemble looks from your closet.</div>

      {/* Occasion selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {RECO_OCCASIONS.map(o => (
          <button key={o.key}
            onClick={() => { setOccasion(o.key); run(o.key); }}
            style={{
              background: occasion === o.key ? C.ink : 'transparent',
              color: occasion === o.key ? C.paper : C.ink,
              border: `1px solid ${occasion === o.key ? C.ink : C.line}`,
              borderRadius: R.r3, cursor: 'pointer',
              padding: '7px 16px',
              fontFamily: FN, fontSize: 13, fontWeight: 500,
            }}>{o.label}</button>
        ))}
        <window.SoftButton variant="primary" size="sm" onClick={() => run()}>
          {ran ? '↻ Restyle' : '✦ Suggest looks'}
        </window.SoftButton>
      </div>

      {/* Results */}
      {notEnough && (
        <div style={{
          background: C.cream, borderRadius: R.r1, padding: 14,
          fontFamily: FN, fontSize: 13, color: C.muted, lineHeight: 1.5,
        }}>
          You'll need at least one <b style={{ color: C.ink }}>top</b> and one{' '}
          <b style={{ color: C.ink }}>bottom</b> in your closet for this occasion.
          Add a few pieces and try again.
        </div>
      )}

      {ran && !notEnough && outfits.length === 0 && (
        <div style={{
          background: C.cream, borderRadius: R.r1, padding: 14,
          fontFamily: FN, fontSize: 13, color: C.muted, lineHeight: 1.5,
        }}>No coherent {occasion} looks yet — every combination clashed on occasion. Try another occasion or add more pieces.</div>
      )}

      {outfits.length > 0 && (
        <div style={{ display: 'grid', gap: compact ? 14 : 18 }}>
          {outfits.map((o, idx) => (
            <RecoCard key={idx} outfit={o} rank={idx} onApply={onApply} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecoCard({ outfit, rank, onApply, compact }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const pct = Math.round(outfit.score * 100);
  const ordered = ['top', 'bottom', 'outerwear', 'shoes']
    .map(s => outfit.slots[s]).filter(Boolean);
  const hasFallback = (outfit.fallbacks || []).length > 0;

  return (
    <div style={{
      border: `1px solid ${C.line}`, borderRadius: R.r2,
      padding: compact ? 16 : 20, background: rank === 0 ? `color-mix(in oklab, ${C.butter}, ${C.paper} 78%)` : C.paper,
      display: 'grid', gap: compact ? 14 : 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rank === 0 && (
            <span style={{
              fontFamily: FN, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
              background: C.ink, color: C.paper, padding: '3px 8px', borderRadius: R.r3,
            }}>Top pick</span>
          )}
          <span style={{ fontFamily: FS, fontSize: compact ? 18 : 20, color: C.ink }}>
            {pct}% match
          </span>
        </div>
        <window.SoftButton variant="cream" size="sm" onClick={() => onApply(outfit)}>Wear this</window.SoftButton>
      </div>

      {/* item thumbnails — responsive grid so each tile has room for its label */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(ordered.length, 4)}, 1fr)`,
        gap: compact ? 10 : 14,
      }}>
        {ordered.map((it, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <window.GarmentTile item={it._raw || it} size={compact ? 'sm' : 'md'} />
            {it._fallback && (
              <span title="Filled from an adjacent occasion" style={{
                position: 'absolute', top: 8, right: 8, width: 9, height: 9,
                borderRadius: '50%', background: C.terra, border: `2px solid ${C.paper}`,
              }}/>
            )}
          </div>
        ))}
      </div>

      {/* explanation */}
      {(outfit.explanation || []).length > 0 && (
        <div style={{ display: 'grid', gap: 5 }}>
          {outfit.explanation.map((line, i) => (
            <div key={i} style={{
              fontFamily: FS, fontStyle: 'italic', fontSize: compact ? 14 : 15,
              color: C.ink, lineHeight: 1.5,
            }}>{line}</div>
          ))}
        </div>
      )}

      {/* sub-score chips */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {[
          ['occasion', outfit.breakdown.occasion],
          ['color', outfit.breakdown.color],
          ['pattern', outfit.breakdown.pattern],
        ].map(([k, v]) => (
          <span key={k} style={{
            fontFamily: FN, fontSize: 11, color: C.muted,
            background: C.cream, borderRadius: R.r3, padding: '4px 11px',
          }}>{k} {Math.round(v * 100)}{hasFallback && k === 'occasion' ? ' ·fallback' : ''}</span>
        ))}
      </div>
    </div>
  );
}

window.RecoPanel = RecoPanel;
window.RecoCard = RecoCard;
