const items = [
  { key: 'home', label: '홈', screen: '1' },
  { key: 'category', label: '카테고리', screen: null },
  { key: 'discover', label: '발견', screen: null },
  { key: 'store', label: '올영매장', screen: '2' },
  { key: 'heart', label: '좋아요', screen: null },
  { key: 'my', label: '마이', screen: null },
];

function NavIcon({ name }) {
  switch (name) {
    case 'home':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, display: 'block' }}>
          <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: -37.5, top: -35.71, width: 100, height: 100, WebkitMaskImage: 'url(/icons/nav-home-figma-mask.png)', maskImage: 'url(/icons/nav-home-figma-mask.png)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '33.495px 33.713px', maskPosition: '33.495px 33.713px', WebkitMaskSize: '37px 37px', maskSize: '37px 37px' }} />
        </span>
      );
    case 'category':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, display: 'block' }}>
          <span style={{ position: 'absolute', width: 21, height: 21, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: -42, top: -41.26, width: 100, height: 100, WebkitMaskImage: 'url(/icons/nav-category.svg)', maskImage: 'url(/icons/nav-category.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '44px 43.794px', maskPosition: '44px 43.794px', WebkitMaskSize: '17px 16.465px', maskSize: '17px 16.465px' }} />
          </span>
        </span>
      );
    case 'discover':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, overflow: 'hidden', display: 'block' }}>
          <span style={{ position: 'absolute', width: 35, height: 35, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: 4, top: 5.74, width: 27, height: 29, WebkitMaskImage: 'url(/icons/nav-discover.png)', maskImage: 'url(/icons/nav-discover.png)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '-3px -2.741px', maskPosition: '-3px -2.741px', WebkitMaskSize: '34px 34px', maskSize: '34px 34px' }} />
          </span>
        </span>
      );
    case 'store':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, overflow: 'hidden', display: 'block' }}>
          <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: -43.48, top: -40.71, width: 100, height: 100, WebkitMaskImage: 'url(/icons/nav-store-active-mask.png)', maskImage: 'url(/icons/nav-store-active-mask.png)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '44.485px 42.713px', maskPosition: '44.485px 42.713px', WebkitMaskSize: '28px 28px', maskSize: '28px 28px' }} />
        </span>
      );
    case 'heart':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, overflow: 'hidden', display: 'block' }}>
          <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: -37.49, top: -30.71, width: 100, height: 100, WebkitMaskImage: 'url(/icons/nav-heart.png)', maskImage: 'url(/icons/nav-heart.png)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '38px 32px', maskPosition: '38px 32px', WebkitMaskSize: '28px 30px', maskSize: '28px 30px' }} />
        </span>
      );
    case 'my':
      return (
        <span style={{ position: 'relative', width: 30, height: 30, display: 'block' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, width: 30, height: 30, overflow: 'hidden' }}>
            <span style={{ position: 'absolute', backgroundColor: 'currentColor', left: -37.49, top: -30.71, width: 100, height: 100, WebkitMaskImage: 'url(/icons/nav-my.png)', maskImage: 'url(/icons/nav-my.png)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '40px 34.259px', maskPosition: '40px 34.259px', WebkitMaskSize: '26px 26px', maskSize: '26px 26px' }} />
          </span>
        </span>
      );
    default:
      return null;
  }
}

export default function BottomNav({ active, onNav, hidden = false }) {
  return (
    <nav className={`bottomnav${hidden ? ' is-hidden' : ''}`} aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <button
          key={it.key}
          className={'navitem' + (active === it.key ? ' active' : '')}
          aria-current={active === it.key ? 'page' : undefined}
          disabled={active !== it.key}
          tabIndex={hidden ? -1 : undefined}
          onClick={() => it.screen && onNav(it.screen)}
        >
          <NavIcon name={it.key} />
          <span className="lbl">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
