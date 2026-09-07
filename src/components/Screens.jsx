import { useEffect, useRef, useState } from 'react';
import BottomNav from './BottomNav.jsx';
import { loadKakaoMaps } from '../kakao-map.js';
import { PRODUCTS, STORES, getStoreNewsForStore, won, MAIN_STORE } from '../data.js';
import {
  FIXED_LOCATION,
  distanceKm,
  filterStoreCrewTalks,
  filterStoreNotices,
  formatDistance,
  selectNearestStores,
  sortDatedItems,
  toggleExpandedId,
  walkingMinutes,
} from '../store-utils.js';
import ExpandableCrewTalk from './ExpandableCrewTalk.jsx';

export function getStorePreviewCenter(store) {
  return { lat: store.lat, lng: store.lng };
}

export function KakaoStorePreviewMap({ store }) {
  const mapElementRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let disposed = false;
    let overlay;

    loadKakaoMaps(import.meta.env.VITE_KAKAO_MAP_KEY)
      .then((maps) => {
        if (disposed || !mapElementRef.current) return;

        const previewCenter = getStorePreviewCenter(store);
        const center = new maps.LatLng(previewCenter.lat, previewCenter.lng);
        const map = new maps.Map(mapElementRef.current, {
          center,
          level: 4,
          draggable: false,
          scrollwheel: false,
          disableDoubleClick: true,
          disableDoubleClickZoom: true,
          keyboardShortcuts: false,
        });
        map.setDraggable(false);
        map.setZoomable(false);

        const pin = document.createElement('div');
        pin.className = 'pin';
        const label = document.createElement('span');
        label.className = 'pin-label';
        label.textContent = store.name;
        const stock = document.createElement('span');
        stock.className = 'pin-stock';
        stock.textContent = String(store.stock);
        pin.append(label, stock);

        overlay = new maps.CustomOverlay({
          map,
          position: new maps.LatLng(store.lat, store.lng),
          content: pin,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 2,
        });

        setMapReady(true);
        setMapError('');
      })
      .catch((error) => {
        if (!disposed) setMapError(error.message);
      });

    return () => {
      disposed = true;
      overlay?.setMap(null);
    };
  }, [store]);

  return (
    <div className="reco-map" data-map-provider="kakao" aria-label="충무로 주변 카카오 지도">
      <div className="reco-map-canvas" ref={mapElementRef} />
      <span className="sr-only">{store.name}, 재고 {store.stock}개</span>
      {!mapReady && <span className="reco-map-loading">{mapError || '지도를 불러오는 중이에요.'}</span>}
    </div>
  );
}

export function selectHomePreviewStore(stores) {
  return stores.find((store) => store.id === 'cj-training-center')
    ?? selectNearestStores(stores, FIXED_LOCATION, 1)[0];
}

export function StoreHome({ onNav, onOpenProduct }) {
  const [expandedTalkIds, setExpandedTalkIds] = useState([]);
  const nearbyStores = selectNearestStores(STORES, FIXED_LOCATION, 2);
  const nearestStore = selectHomePreviewStore(STORES);
  const nearestDistance = distanceKm(FIXED_LOCATION, nearestStore);
  const recommendations = [
    { label: '10일 전 장바구니에 담았어요', product: PRODUCTS[0] },
    { label: '2개월 전 구매했던 제품이에요', product: PRODUCTS[2] },
  ];

  return (
    <section className="screen active" id="screen-2" data-scroll-mode="document">
      <div className="screen-body">
        <header className="store-home-header">
          <h1>올영매장</h1>
          <div className="store-header-actions">
            <button type="button" aria-label="매장 검색"><img src="/icons/store-search.svg" alt="" /></button>
            <button type="button" aria-label="장바구니"><img src="/icons/store-bag.png" alt="" /></button>
          </div>
        </header>

        <section className="store-quick-section" aria-label="매장 바로가기">
          <div className="qm-row">
            <div className="qm"><div className="ic"><img src="/icons/qm-store.png" alt="" /></div>매장찾기</div>
            <button type="button" className="qm hi" aria-label="올클맵 열기" onClick={() => onNav('3b')}>
              <span className="ic"><span className="olcl-art"><img src="/icons/qm-clover.png" alt="" /></span></span>
              <span className="qm-label">올클맵</span>
            </button>
            <div className="qm"><div className="ic"><img src="/icons/qm-map.png" alt="" /></div>매장재고</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-stock.png" alt="" /></div>쿠폰/증정</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-coupon.png" alt="" /></div>스킨스캔</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-skin.png" alt="" /></div>올영명소</div>
          </div>
        </section>

        <section className="store-recommendations">
          <h2 className="reco-title">정열창님,<br />도보 <b>{walkingMinutes(nearestDistance)}</b>분 거리에서 득템해보세요!</h2>
          <span className="sr-only">{FIXED_LOCATION.address}</span>
          <div className="reco-map-entry">
            <KakaoStorePreviewMap store={nearestStore} />
            <button
              type="button"
              className="reco-map-link"
              aria-label="올클맵 지도 미리보기 열기"
              onClick={() => onNav('3b')}
            />
          </div>

          <div className="reco-list">
            {recommendations.map(({ label, product }) => (
              <article className="reco-item" key={product.id}>
                <div className="lbl">{label}</div>
                <div className="row">
                  <button
                    type="button"
                    className="reco-product-image-link"
                    aria-label={`${product.name} 상품 상세 보기`}
                    onClick={() => onOpenProduct?.(product.id)}
                  >
                    <img className="prod" src={product.img} alt="" />
                  </button>
                  <div className="reco-product-info">
                    <button
                      type="button"
                      className="name reco-product-name-link"
                      onClick={() => onOpenProduct?.(product.id)}
                    >
                      {product.name}
                    </button>
                    <div className="reco-meta"><span className="sub">{product.variant}</span><span className="stock">잔여 재고 {product.stock}개</span></div>
                    {product.talk && (
                      <ExpandableCrewTalk
                        className="crewtalk"
                        message={product.talk}
                        expanded={expandedTalkIds.includes(product.id)}
                        onToggle={() => setExpandedTalkIds((current) => toggleExpandedId(current, product.id))}
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="store-benefits">
          <div className="store-benefit-hd">
            <h2>올리브영 매장 혜택 <img src="/icons/store-union.svg" alt="" /></h2>
            <span className="sort">가까운순 <img src="/icons/store-arrow.svg" alt="" /></span>
          </div>
          {nearbyStores.map((store, index) => (
            <article className="store-benefit-block" key={store.id}>
              <div className="store-card" data-store-benefit="true">
                <img className="thumb" src="/photos/store-hero.png" alt="" />
                <div className="store-card-info">
                  <div className="name">{store.name}<span className="dist">{formatDistance(distanceKm(FIXED_LOCATION, store))}</span></div>
                  <div className="addr">{store.addr}</div>
                  <div className="hours"><strong>영업 중</strong> · 10:00 ~ {index === 0 ? '22:00' : '22:30'}</div>
                  <div className="badges"><span className="benefit">쿠폰/증정</span><span>픽업</span>{index === 0 && <><span>스마트 반품</span><span>신규오픈</span></>}</div>
                </div>
              </div>
              <div className="store-gift-notice">
                <span className="gift-label">증정</span>
                <span className="gift-copy">올리브영 리유저블백</span>
                <img src="/icons/store-arrow.svg" alt="" />
              </div>
            </article>
          ))}
        </section>
      </div>
      <BottomNav active="store" onNav={onNav} />
    </section>
  );
}

export function ProductDetail({ product, store = MAIN_STORE, onBack, onOrder, onNav = () => {} }) {
  if (!product) return null;
  return (
    <section className="screen active" id="screen-product" data-scroll-mode="document">
      <div className="screen-body product-detail-body">
        <div className="topbar product-detail-topbar">
          <button type="button" className="back" onClick={onBack} aria-label="이전 화면으로 돌아가기">
            <img src="/icons/map-back.svg" alt="" />
          </button>
          <div className="product-detail-actions" aria-hidden="true">
            <img src="/icons/store-search.svg" alt="" />
            <img src="/icons/store-bag.png" alt="" />
          </div>
        </div>
        <div className="product-detail-hero">
          <img src={product.img} alt={product.name} />
          <span className="product-image-count">‹ &nbsp; 1&nbsp; | &nbsp;1 &nbsp;›</span>
        </div>
        <div className="product-detail-copy">
          <div className="product-brand-row">
            <strong>{product.brand}</strong>
            <span aria-hidden="true">♡</span>
          </div>
          <h1>{product.name}</h1>
          <p className="product-detail-variant">{product.variant}</p>
          <div className="product-detail-price">
            <del>{won(product.orig)}</del>
            <p><strong>{product.pct}%</strong> <b>{won(product.price)}</b></p>
          </div>
          <div className="product-condition-row">
            {product.badge && <span className="badge-ai">{product.badge}</span>}
            {product.badge2 && <span className="condition-badge">{product.badge2}</span>}
            <span className="product-stock">잔여재고 | {product.stock}개</span>
          </div>
          <section className="product-detail-summary">
            <h2>상품 설명</h2>
            <p>{product.summary}</p>
          </section>
          <section className="product-pickup-store">
            <span>픽업 가능 매장</span>
            <strong>{store.name}</strong>
          </section>
        </div>
      </div>
      <div className="product-detail-orderbar">
        <button type="button" className="product-heart" aria-label="좋아요">♡</button>
        <button type="button" className="btn-black" onClick={() => onOrder(product)}>픽업주문</button>
      </div>
    </section>
  );
}

export const ProductPlaceholder = ProductDetail;

export function StoreDetail({
  store = MAIN_STORE,
  products = PRODUCTS,
  onNav,
  onOrder,
  onOpenProduct,
  onOpenNews,
  toastShown,
  onDismissToast,
  onGoCart,
  bottomNavHidden = false,
}) {
  return (
    <section className="screen active" id="screen-4" data-scroll-mode="document">
      <div className="screen-body">
        <div className="topbar">
          <button className="back" onClick={() => onNav('3b')}><img src="/icons/detail-back.svg" alt="back" /></button>
          <h1>{store.name}</h1>
        </div>
        <div className="store-hero-wrap">
          <img src="/photos/store-hero.png" alt="" />
          <div className="hero-more">이미지 더보기 +</div>
        </div>
        <div className="store-info">
          <div className="lang"><img src="/icons/detail-lang.png" alt="" />한국어</div>
          <div className="name-row">
            <h2>{store.name}</h2>
            <div className="acts"><img src="/icons/detail-star.svg" alt="" /><img src="/icons/detail-dots.svg" alt="" /></div>
          </div>
          <div className="en">{store.englishName ?? store.addr}</div>
        </div>
        <div className="store-actions"><button className="btn-outline">매장 상품 보기</button><button className="btn-outline" onClick={() => onOpenNews?.(store)}>매장 소식</button></div>
        <div className="store-tabs"><span>기본 정보</span><span>매장행사</span><span>인기 상품</span><span className="active">클리어런스</span></div>
        <div id="store-products">
          {products.map((p) => (
            <div className="pcard" key={p.listKey ?? p.id} data-detail-product="true">
              <div className="row">
                <button type="button" className="pcard-product-link" onClick={() => onOpenProduct?.(p.id)}>
                  <img className="prod" src={p.img} alt="" />
                </button>
                <div className="info">
                  <button type="button" className="nm pcard-name-link" onClick={() => onOpenProduct?.(p.id)}>{p.name}</button>
                  <div className="subrow">
                    <span className="variant">{p.variant}</span>
                    {p.badge && <span className="badge-ai">{p.badge}</span>}
                    {p.badge2 && <span className="condition-badge">{p.badge2}</span>}
                  </div>
                  <div className="stockpill">잔여재고 | {p.stock}개</div>
                  <div className="pricebar">
                    <span><span className="pct">{p.pct}%</span><span className="now">{won(p.price)}</span><span className="orig">{won(p.orig)}</span></span>
                    <button className="order-btn" onClick={() => onOrder(p)}>픽업주문</button>
                  </div>
                </div>
              </div>
              {p.talk && (
                <ExpandableCrewTalk
                  className="talk"
                  message={p.talk}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="store" onNav={onNav} hidden={bottomNavHidden} />
      {toastShown && (
        <div className="toast" role="status">
          <span>나의 픽업 장바구니에 담았어요</span>
          <button type="button" className="toast-link" onClick={onGoCart}>장바구니로 이동</button>
          <button type="button" className="toast-close" aria-label="알림 닫기" onClick={onDismissToast}>×</button>
        </div>
      )}
    </section>
  );
}

export function StoreNewsTabs({ tab, onTabChange, noticeCount = 5, crewTalkCount = 11 }) {
  const isNotice = tab === 'notice';
  function handleKeyDown(event) {
    let nextTab = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') nextTab = isNotice ? 'crew' : 'notice';
    if (event.key === 'End') nextTab = 'crew';
    if (event.key === 'Home') nextTab = 'notice';
    if (!nextTab) return;
    event.preventDefault?.();
    onTabChange(nextTab);
    event.currentTarget?.parentElement?.querySelector(`#store-news-${nextTab}-tab`)?.focus();
  }

  return (
    <div className="store-news-tabs" role="tablist" aria-label="매장 소식 유형">
      <button
        type="button"
        id="store-news-notice-tab"
        role="tab"
        aria-selected={isNotice}
        aria-controls="store-news-notice-panel"
        tabIndex={isNotice ? 0 : -1}
        className={isNotice ? 'active' : ''}
        onClick={() => onTabChange('notice')}
        onKeyDown={handleKeyDown}
      >
        공지({noticeCount})
      </button>
      <button
        type="button"
        id="store-news-crew-tab"
        role="tab"
        aria-selected={!isNotice}
        aria-controls="store-news-crew-panel"
        tabIndex={!isNotice ? 0 : -1}
        className={!isNotice ? 'active' : ''}
        onClick={() => onTabChange('crew')}
        onKeyDown={handleKeyDown}
      >
        크루톡({crewTalkCount})
      </button>
    </div>
  );
}

export function updateStoreNewsQueries(queries, tab, value) {
  return { ...queries, [tab]: value };
}

export function StoreNews({ store = MAIN_STORE, tab = 'notice', onBack, onTabChange, onOpenProduct, onNav = () => {} }) {
  const [queries, setQueries] = useState({ notice: '', crew: '' });
  const [sortOrders, setSortOrders] = useState({ notice: 'latest', crew: 'latest' });
  const isNotice = tab === 'notice';
  const query = queries[tab];
  const sortOrder = sortOrders[tab];
  const storeNews = getStoreNewsForStore(store);
  const notices = sortDatedItems(
    filterStoreNotices(storeNews.notices, store, query),
    sortOrder,
  );
  const crewTalks = sortDatedItems(
    filterStoreCrewTalks(storeNews.crewTalks, store, query),
    sortOrder,
  );

  return (
    <section className="screen active store-news-screen" id={isNotice ? 'screen-3-5-a' : 'screen-3-5-b'} data-scroll-mode="document">
      <div className="screen-body">
        <div className="topbar store-news-topbar">
          <button type="button" className="back" onClick={onBack} aria-label="매장 상세로 돌아가기">
            <img src="/icons/detail-back.svg" alt="" />
          </button>
          <h1>매장 소식</h1>
        </div>

        <StoreNewsTabs
          tab={tab}
          onTabChange={onTabChange}
          noticeCount={storeNews.notices.length}
          crewTalkCount={storeNews.crewTalks.length}
        />

        <div className="store-news-searchbar">
          <label className="store-news-search">
            <span className="sr-only">{isNotice ? '매장 소식 검색' : '크루톡 상품 검색'}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQueries((current) => updateStoreNewsQueries(current, tab, event.target.value))}
              placeholder={isNotice ? '궁금한 소식을 검색해보세요' : '궁금한 상품명을 검색해보세요'}
            />
            <img src="/icons/store-search.svg" alt="" />
          </label>
          <label className="store-news-sort">
            <select
              aria-label={`${isNotice ? '공지' : '크루톡'} 정렬`}
              value={sortOrder}
              onChange={(event) => setSortOrders((current) => ({ ...current, [tab]: event.target.value }))}
            >
              <option value="latest">최신순</option>
              <option value="registered">등록순</option>
            </select>
            <img src="/icons/store-arrow.svg" alt="" />
          </label>
        </div>

        {isNotice ? (
          <div
            className="store-notice-list"
            id="store-news-notice-panel"
            role="tabpanel"
            aria-labelledby="store-news-notice-tab"
            tabIndex={0}
          >
            {notices.length ? notices.map((notice) => (
              <article className="store-notice-item" key={notice.id}>
                <div className="store-news-meta"><b>{store.name}</b><time>{notice.date}</time></div>
                <p>{notice.message}</p>
              </article>
            )) : <p className="store-news-empty">검색 결과가 없습니다.</p>}
          </div>
        ) : (
          <div
            className="store-news-talk-list"
            id="store-news-crew-panel"
            role="tabpanel"
            aria-labelledby="store-news-crew-tab"
            tabIndex={0}
          >
            {crewTalks.length ? crewTalks.map(({ id, product, date, message }) => (
              <article className="store-news-talk-item" key={id}>
                <button
                  type="button"
                  className="store-news-product-thumb"
                  aria-label={`${product.name} 상세 보기`}
                  onClick={() => onOpenProduct(product.id, store)}
                >
                  <img className="product-thumb" src={product.img} alt="" />
                </button>
                <div className="store-news-talk-content">
                  <div className="store-news-product-row">
                    <div>
                      <button
                        type="button"
                        className="store-news-product-name"
                        aria-label={`${product.name} 상세 보기`}
                        onClick={() => onOpenProduct(product.id, store)}
                      >
                        <h2>{product.name}</h2>
                      </button>
                      <p className="store-news-product-meta">{product.variant} · <span>잔여 재고 {product.stock}개</span></p>
                    </div>
                    <time>{date}</time>
                  </div>
                  <ExpandableCrewTalk
                    className="store-news-talk-bubble"
                    label={store.name}
                    message={message}
                  />
                </div>
              </article>
            )) : <p className="store-news-empty">검색 결과가 없습니다.</p>}
          </div>
        )}
      </div>
      <BottomNav active="store" onNav={onNav} />
    </section>
  );
}

export function Cart({ onNav, cart, store = MAIN_STORE, onQtyChange, onPurchase }) {
  const origSum = cart.reduce((s, e) => s + e.product.orig * e.qty, 0);
  const totalSum = cart.reduce((s, e) => s + e.product.price * e.qty, 0);
  return (
    <section className="screen active" id="screen-6" data-scroll-mode="document">
      <div className="screen-body">
        <div className="cart-topbar">
          <button className="back" onClick={() => onNav('4')}><img src="/icons/cart-back.svg" alt="back" /></button>
          <h1>장바구니</h1>
          <div className="icons">
            <img src="/icons/home-search.svg" alt="" />
            <span style={{ position: 'relative', width: 22, height: 26, display: 'block' }}>
              <span
                style={{
                  position: 'absolute', backgroundColor: '#222', left: -37, top: -39.99, width: 100, height: 100,
                  WebkitMaskImage: 'url(/icons/nav-home.png)', maskImage: 'url(/icons/nav-home.png)',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: '30px 33.993px', maskPosition: '30px 33.993px',
                  WebkitMaskSize: '37px 37px', maskSize: '37px 37px',
                }}
              />
            </span>
          </div>
        </div>
        <div className="cart-tabs"><span>일반 배송(2)</span><span>오늘드림</span><span className="active">픽업({cart.length})</span></div>
        <div className="cart-selectbar">
          <div className="left">
            <span className="chk"><img src="/icons/cart-check.svg" alt="" /></span>
            전체 &nbsp;|&nbsp; 배송방법 변경 <span className="chevron"><img src="/icons/cart-chevron.svg" alt="" /></span>
          </div>
          <div className="del">선택삭제</div>
        </div>
        <div className="cart-groupbar">
          픽업 <img className="info" src="/icons/cart-info.svg" alt="" />
          <span className="note" style={{ marginLeft: 'auto' }}>실제 재고는 상이할 수 있습니다</span>
        </div>
        <div className="cart-store-select">
          <div className="lft">픽업 매장 › <b>{store.name}</b></div>
          <div className="chg">매장변경</div>
        </div>
        <div>
          {cart.map((entry, idx) => (
            <div className="cart-box" key={idx}>
              <div className="title">
                올클맵 픽업
                <span className="chk"><img src="/icons/cart-check.svg" alt="" /></span>
              </div>
              <div className="row">
                <img className="prod" src={entry.product.img} alt="" />
                <div className="info">
                  <div className="nm">{entry.product.name} <img src="/icons/cart-item-arrow.svg" alt="" /></div>
                  <div className="eta">{idx === 0 ? '6시간' : '3시간'} 내 픽업</div>
                </div>
              </div>
              <div className="optionbox">{entry.product.variant} <img src="/icons/cart-chevron.svg" alt="" /></div>
              <div className="qtyrow2">
                <div className="qty-stepper">
                  <button onClick={() => onQtyChange(idx, -1)} disabled={entry.qty <= 1}><img src="/icons/cart-minus.svg" alt="-" /></button>
                  <span className="val">{entry.qty}</span>
                  <button onClick={() => onQtyChange(idx, 1)} disabled={entry.qty >= entry.product.stock}><img src="/icons/cart-plus.svg" alt="+" /></button>
                </div>
                <div className="price">
                  <span style={{ textDecoration: 'line-through', color: '#666', fontSize: 12 }}>{won(entry.product.orig)}</span>{' '}
                  <span style={{ fontWeight: 600, fontSize: 18 }}>{won(entry.product.price * entry.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-sep"></div>
        <div className="cart-sum">
          <div className="row"><span>총 상품금액</span><span>{won(origSum)}</span></div>
          <div className="row"><span>총 할인금액</span><span>{won(origSum - totalSum)}</span></div>
          <div className="row total"><span>최종 결제금액</span><span>{won(totalSum)}</span></div>
          <div className="note"><img src="/icons/cart-note-icon.svg" alt="" />쿠폰 적용 및 결제 수단에 따라 최종 금액이 변경될 수 있습니다.</div>
        </div>
        <div className="cart-sep" style={{ height: 2 }}></div>
        <div className="cart-bottom"><span className="l">총 {cart.length}건 {won(totalSum)}</span><span className="r">{won(totalSum)}</span></div>
      </div>
      <div className="cart-cta"><button className="btn-black" style={{ width: '100%' }} onClick={onPurchase}>픽업 구매하기</button></div>
    </section>
  );
}
