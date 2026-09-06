export const MAIN_STORE = {
  name: '올리브영 명동 타운',
  englishName: 'OLIVE YOUNG MYEONGDONG GLOBAL',
  addr: '서울특별시 중구 명동길 53 1~2층',
  tel: '1577-4887',
  lat: 37.5641193,
  lng: 126.9851661,
};

export const STORES = [
  { id: 'town', name: '올리브영 명동 타운', englishName: 'OLIVE YOUNG MYEONGDONG GLOBAL', addr: '서울특별시 중구 명동길 53 1~2층', lat: 37.5641193, lng: 126.9851661, stock: 32, ai: true },
  { id: 'chungmuro', name: '올리브영 충무로역점', addr: '서울특별시 중구 퇴계로 222 (필동2가)', lat: 37.5615827, lng: 126.9962525, stock: 7, ai: true },
  { id: 'jungang', name: '올리브영 명동중앙점', addr: '서울특별시 중구 명동8나길 18', lat: 37.561567, lng: 126.984003, stock: 12 },
  { id: 'daero', name: '올리브영 명동대로점', addr: '서울특별시 중구 퇴계로 120', lat: 37.5606047, lng: 126.9850862, stock: 14 },
  { id: 'yeok', name: '올리브영 명동역점', addr: '서울특별시 중구 퇴계로 115 밀리오레', lat: 37.5610311, lng: 126.984686, stock: 22 },
  { id: 'ddm', name: '올리브영 동대문역사문화공원역점', addr: '서울특별시 중구 장충단로 251', lat: 37.5651, lng: 127.0074, stock: 6 },
  { id: 'cityhall', name: '올리브영 시청역점', addr: '서울특별시 중구', lat: 37.5658, lng: 126.977, stock: 11 },
  { id: 'jum', name: '올리브영 명동점', addr: '서울특별시 중구 명동8길 14', lat: 37.5629174, lng: 126.9849426, stock: 9 },
  { id: 'central', name: '올리브영 센트럴 명동 타운', addr: '서울특별시 중구 명동8길 27 (엠플라자)', lat: 37.5616385, lng: 126.9849097, stock: 18 },
  { id: 'timewalk', name: '올리브영 명동타임워크점', addr: '서울특별시 중구 남대문로 78', lat: 37.5643473, lng: 126.9829236, stock: 15 },
];

export const PRODUCTS = [
  { id: 'p1', name: '[NEW두유코어] 롬앤 베러 댄 치크', variant: '[두유] D01 소이 피치', img: '/photos/product-1.png', orig: 12000, price: 7680, pct: 36, stock: 3, badge: 'AI PICK', badge2: '유통기한', talk: '매장에서 제일 인기많은 제품인데 이번에 클리어런스로 풀렸네요~~ 얼른 겟해가세용! 저희 크루들은 거의 대부분 전 색상 소장하고 있답니다 ^0^' },
  { id: 'p2', name: '[NEW 컬러 출시] 헤라 센슈얼 파우더 매트 리퀴드 5g', variant: '499호 로즈 스웨이드', img: '/photos/product-2.png', orig: 40000, price: 24600, pct: 39, stock: 1, badge2: '패키지 파손' },
  { id: 'p3', name: '[수부지토너] 브링그린 티트리 시카 수딩 토너', variant: '[대용량]500ml (+세럼3ml)', img: '/photos/product-3.png', orig: 15000, price: 6750, pct: 55, stock: 2, badge: 'AI PICK', talk: '여드름성 피부 크루들이 쟁여놓고 쓰는 템!! 아침 닦토, 저녁 토너팩으로 쓰면 민감성 루틴 완성이에요!' },
  { id: 'p4', name: '[1등속눈썹영양제] 코스노리 아이래쉬 세럼 9g', variant: '[포켓몬에디션] 속눈썹영양제', img: '/photos/product-4.png', orig: 18000, price: 10800, pct: 40, stock: 1, badge2: '패키지 파손' },
  { id: 'p5', name: '[베이스1위] 더샘 커버 퍼펙션 트리플 팟 컨실러', variant: '01 코렉트 베이지', img: '/photos/product-5.png', orig: 12000, price: 4800, pct: 60, stock: 2 },
];

export const CREW_TALKS = [
  { id: 'talk-p1', product: PRODUCTS[0], store: STORES[0], date: '2026.08.19', message: PRODUCTS[0].talk },
  { id: 'talk-p4', product: PRODUCTS[3], store: { name: '명동거리점' }, date: '2026.08.12', message: '뽑하고 사용하면 마스카라처럼 가닥 속눈썹 연출 가능해요! 속눈썹 풍성해지는 매력까지...♡' },
  { id: 'talk-p5', product: PRODUCTS[4], store: STORES[7], date: '2026.08.12', message: '다크서클 커버할 때 필수예요! 화홍 258 브러쉬와 궁합이 좋아요.' },
  { id: 'talk-p3', product: PRODUCTS[2], store: STORES[3], date: '2026.08.16', message: PRODUCTS[2].talk },
  { id: 'talk-p2', product: PRODUCTS[1], store: STORES[4], date: '2026.08.19', message: '컬러가 분위기 있게 올라와서 가을 메이크업에 추천해요. 얇게 여러 번 발라보세요.' },
];

export const won = (n) => n.toLocaleString('ko-KR') + '원';
