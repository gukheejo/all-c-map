import BottomNav from './BottomNav.jsx';
import { PRODUCTS, STORES, won, MAIN_STORE } from '../data.js';
import {
  FIXED_LOCATION,
  distanceKm,
  formatDistance,
  selectNearestStores,
  walkingMinutes,
} from '../store-utils.js';

export function StoreHome({ onNav }) {
  const nearbyStores = selectNearestStores(STORES, FIXED_LOCATION, 2);
  const nearestStore = nearbyStores[0];
  const nearestDistance = distanceKm(FIXED_LOCATION, nearestStore);
  const recommendations = [
    { label: '10일 전 장바구니에 담았어요', product: PRODUCTS[0] },
    { label: '2개월 전 구매했던 제품이에요', product: PRODUCTS[2] },
  ];

  return (
    <section className="screen active" id="screen-2">
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
            <button type="button" className="qm hi" aria-label="올클맵 열기" onClick={() => onNav('3b')}><span className="ic"><img src="/icons/qm-clover.png" alt="" /></span><span className="qm-label">올클맵</span></button>
            <div className="qm"><div className="ic"><img src="/icons/qm-map.png" alt="" /></div>매장재고</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-stock.png" alt="" /></div>쿠폰/증정</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-coupon.png" alt="" /></div>스킨스캔</div>
            <div className="qm"><div className="ic"><img src="/icons/qm-skin.png" alt="" /></div>올영명소</div>
          </div>
        </section>

        <section className="store-recommendations">
          <h2 className="reco-title">정열창님,<br />도보 <b>{walkingMinutes(nearestDistance)}</b>분 거리에서 득템해보세요!</h2>
          <span className="sr-only">{FIXED_LOCATION.address}</span>
          <div className="reco-map" aria-label={`${FIXED_LOCATION.address} 기준 ${nearestStore.name}`}>
            <div className="pin">
              {nearestStore.name}
              <span className="pin-stock">{nearestStore.stock}</span>
            </div>
          </div>

          <div className="reco-list">
            {recommendations.map(({ label, product }) => (
              <article className="reco-item" key={product.id}>
                <div className="lbl">{label}</div>
                <div className="row">
                  <img className="prod" src={product.img} alt="" />
                  <div className="reco-product-info">
                    <div className="name">{product.name}</div>
                    <div className="reco-meta"><span className="sub">{product.variant}</span><span className="stock">잔여 재고 {product.stock}개</span></div>
                    {product.talk && <div className="crewtalk" role="note"><b>크루TALK</b><span className="crewtalk-copy">{product.talk}</span></div>}
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
                  <div className="badges"><span className="benefit">쿠폰/증정</span><span>픽업</span>{index === 0 && <span>스마트 반품</span>}</div>
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

export function ProductPlaceholder({ product, onNav }) {
  if (!product) return null;
  return (
    <section className="screen active" id="screen-product">
      <div className="topbar">
        <button className="back" onClick={() => onNav('3b')}><img src="/icons/map-back.svg" alt="back" /></button>
        <h1>상품 상세</h1>
      </div>
      <div className="placeholder-body">
        <img className="prod" src={product.img} alt="" />
        <h2>{product.name}</h2>
        <p>올클맵에서 제품을 클릭하면 기존 올리브영 제품상세 페이지로 연결됩니다. (이 데모에서는 별도 구현 범위 밖이라 placeholder만 표시)</p>
        <button className="btn-outline" style={{ width: 160 }} onClick={() => onNav('3b')}>지도로 돌아가기</button>
      </div>
    </section>
  );
}

export function StoreDetail({ onNav, onOrder, toastShown, onGoCart }) {
  return (
    <section className="screen active" id="screen-4">
      <div className="screen-body">
        <div className="topbar">
          <button className="back" onClick={() => onNav('3b')}><img src="/icons/detail-back.svg" alt="back" /></button>
          <h1>올리브영 명동 타운</h1>
        </div>
        <div className="store-hero-wrap">
          <img src="/photos/store-hero.png" alt="" />
          <div className="hero-more">이미지 더보기 +</div>
        </div>
        <div className="store-info">
          <div className="lang"><img src="/icons/detail-lang.png" alt="" />한국어</div>
          <div className="name-row">
            <h2>올리브영 명동 타운</h2>
            <div className="acts"><img src="/icons/detail-star.svg" alt="" /><img src="/icons/detail-dots.svg" alt="" /></div>
          </div>
          <div className="en">OLIVE YOUNG MYEONGDONG GLOBAL</div>
        </div>
        <div className="store-actions"><button className="btn-outline">매장 상품 보기</button><button className="btn-outline">매장 소식</button></div>
        <div className="store-tabs"><span>기본 정보</span><span>매장행사</span><span>인기 상품</span><span className="active">클리어런스</span></div>
        <div id="store-products">
          {PRODUCTS.map((p) => (
            <div className="pcard" key={p.id}>
              <div className="row">
                <img className="prod" src={p.img} alt="" />
                <div className="info">
                  <div className="nm">{p.name}</div>
                  <div className="subrow">
                    <span className="variant">{p.variant}</span>
                    {p.badge2 && <span className="badge-gray" style={{ borderRadius: 10 }}>{p.badge2}</span>}
                  </div>
                  <div className="stockpill">잔여재고 | {p.stock}개</div>
                  <div className="pricebar">
                    <span><span className="pct">{p.pct}%</span><span className="now">{won(p.price)}</span><span className="orig">{won(p.orig)}</span></span>
                    <button className="order-btn" onClick={() => onOrder(p.id)}>픽업주문</button>
                  </div>
                </div>
              </div>
              {p.talk && <div className="talk"><b>크루TALK</b><span>{p.talk}</span></div>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="store" onNav={onNav} />
      {toastShown && (
        <div className="toast">
          <span>나의 픽업 장바구니에 담았어요</span>
          <a onClick={onGoCart}>장바구니로 이동</a>
        </div>
      )}
    </section>
  );
}

export function Cart({ onNav, cart, onQtyChange, onPurchase }) {
  const origSum = cart.reduce((s, e) => s + e.product.orig * e.qty, 0);
  const totalSum = cart.reduce((s, e) => s + e.product.price * e.qty, 0);
  return (
    <section className="screen active" id="screen-6">
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
          <div className="lft">픽업 매장 › <b>{MAIN_STORE.name}</b></div>
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
                  <button onClick={() => onQtyChange(idx, -1)}><img src="/icons/cart-minus.svg" alt="-" /></button>
                  <span className="val">{entry.qty}</span>
                  <button onClick={() => onQtyChange(idx, 1)}><img src="/icons/cart-plus.svg" alt="+" /></button>
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
