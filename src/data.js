export const MAIN_STORE = {
  name: '올리브영 명동 타운',
  englishName: 'OLIVE YOUNG MYEONGDONG GLOBAL',
  addr: '서울특별시 중구 명동길 53 1~2층',
  tel: '1577-4887',
  lat: 37.5641193,
  lng: 126.9851661,
};

export const STORES = [
  { id: 'town', name: '올리브영 명동 타운', englishName: 'OLIVE YOUNG MYEONGDONG GLOBAL', addr: '서울특별시 중구 명동길 53 1~2층', lat: 37.5641193, lng: 126.9851661, stock: 10, ai: true, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/D176_2026051510042031.jpg?RS=1024x0&QT=85' },
  { id: 'chungmuro', name: '올리브영 충무로역점', addr: '서울특별시 중구 퇴계로 222 (필동2가)', lat: 37.5615827, lng: 126.9962525, stock: 7, ai: true, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/D031_1.jpg?RS=1024x0&QT=85' },
  { id: 'daero', name: '올리브영 명동대로점', addr: '서울특별시 중구 퇴계로 120', lat: 37.5606047, lng: 126.9850862, stock: 14, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/D316_202502520942011.png?RS=1024x0&QT=85' },
  { id: 'yeok', name: '올리브영 명동역점', addr: '서울특별시 중구 퇴계로 115 밀리오레', lat: 37.5610311, lng: 126.984686, stock: 3, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/DE93_2024102971353051.jpg?RS=1024x0&QT=85' },
  { id: 'street', name: '올리브영 명동거리점', addr: '서울특별시 중구 명동8나길 9 (충무로1가)', lat: 37.5613292, lng: 126.9844486, stock: 5, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/DF3C_2025051470910071.png?rs=1200x0&sf=webp&autoorient=y' },
  { id: 'jum', name: '올리브영 명동점', addr: '서울특별시 중구 명동8길 14', lat: 37.5629174, lng: 126.9849426, stock: 9, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/DDEC_1.jpg?rs=1200x0&sf=webp&autoorient=y' },
  { id: 'central', name: '올리브영 센트럴 명동 타운', addr: '서울특별시 중구 명동8길 27 (엠플라자)', lat: 37.5616385, lng: 126.9849097, stock: 13, photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLtsfJCgDAu3osuVzwlGP6Km5zsM1wueztBXTrqsloQw&s=10' },
  { id: 'timewalk', name: '올리브영 명동타임워크점', addr: '서울특별시 중구 남대문로 78', lat: 37.5643473, lng: 126.9829236, stock: 8, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/DD6F_1.jpg?RS=1024x0&QT=85' },
  { id: 'myeongdong2ga', name: '올리브영 명동2가점', addr: '서울특별시 중구 남대문로 68-1', lat: 37.5632324, lng: 126.9822809, stock: 6, photo: 'https://image.oliveyoung.co.kr/cfimages/oystore/DF23_2025071831621131.png?rs=1200x0&sf=webp&autoorient=y' },
  { id: 'cj-training-center', name: '올리브영 CJ인재원점', addr: '서울특별시 중구 필동로 26 (필동2가 101-1)', lat: 37.559175, lng: 126.995635, stock: 8, ai: true, exclusiveProductIds: ['ONLYONEFAIR-CLOVER-MAP'] },
];

export const PRODUCTS = [
  {
    id: 'A000000266721', brand: '웨이크메이크', name: '[레오파드 헬로키티] 웨이크메이크 19종 골라담기', variant: '소프트 블러링 아이팔레트',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026672119ko.jpg?l=ko',
    orig: 44000, price: 28600, pct: 35, stock: 4, badge: 'AI PICK', badge2: '유통기한',
    summary: '다양한 컬러 조합으로 데일리부터 포인트 메이크업까지 연출하기 좋은 메이크업 컬렉션입니다.',
    talk: '컬러 조합이 다양해서 웜톤, 쿨톤 모두 원하는 분위기로 골라 쓰기 좋아요! 은은한 음영부터 포인트 글리터까지 한 팔레트로 연출할 수 있어 데일리 메이크업으로 추천해요.',
  },
  {
    id: 'A000000223414', brand: '메디힐', name: '메디힐 에센셜 마스크팩 10+1매 기획', variant: '마데카소사이드 에센셜 마스크',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0022/A000000223414124ko.png?l=ko',
    orig: 20000, price: 9900, pct: 50, stock: 6, badge: 'AI PICK', badge2: '패키지 파손',
    summary: '피부 고민에 따라 선택할 수 있는 데일리 시트 마스크 기획 상품입니다.',
  },
  {
    id: 'A000000250140', brand: '벨먼', name: '벨먼 고보습 크리미 스크럽워시 400+75ml', variant: '바닐라 머스크',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025014052ko.jpg?l=ko',
    orig: 14900, price: 9500, pct: 36, stock: 2, badge: 'AI PICK', badge2: '유통기한',
    summary: '부드러운 사용감으로 각질 케어와 보습 세정을 함께 돕는 바디 워시입니다.',
    talk: '은은한 향과 촉촉한 마무리감 때문에 바디 케어 입문용으로 추천해요. 부드러운 스크럽 알갱이가 각질을 순하게 정돈해 주고, 샤워 후에도 당김 없이 촉촉해서 건조한 계절에 쓰기 좋아요.',
  },
  {
    id: 'A000000258196', brand: '웨이크메이크', name: '웨이크메이크 볼드 립 블러 틴트', variant: '02 로지 블러',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025819640ko.jpg?l=ko',
    orig: 16000, price: 9600, pct: 40, stock: 1, badge2: '패키지 파손',
    summary: '입술에 부드럽게 밀착되어 선명한 블러 표현을 완성하는 립 틴트입니다.',
  },
  {
    id: 'A000000262863', brand: '웨이크메이크', name: '웨이크메이크 립 앤 아이 키트', variant: '쿨톤 키트',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026286314ko.jpg?l=ko',
    orig: 44000, price: 26400, pct: 40, stock: 3, badge2: '유통기한',
    summary: '립과 아이 메이크업을 한 번에 구성할 수 있는 컬러 키트입니다.',
  },
  {
    id: 'A000000262413', brand: '메디힐', name: '메디힐 더마 토너패드 100+100매', variant: '마데카소사이드 흔적 패드',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A000000262413241ko.png?l=ko',
    orig: 39900, price: 25900, pct: 35, stock: 5, badge2: '패키지 파손',
    summary: '매일 피부결을 정돈하고 촉촉하게 관리할 수 있는 대용량 토너 패드입니다.',
    talk: '양이 넉넉해 아침에는 피부결 정돈용으로, 저녁에는 진정 팩으로 쓰기 좋아요. 양쪽 볼과 이마에 잠시 올려둔 뒤 남은 에센스를 가볍게 두드려 흡수시키면 촉촉함이 오래 유지돼요.',
  },
  {
    id: 'A000000180532', brand: '웨이크메이크', name: '웨이크메이크 소프트 블러링 아이팔레트', variant: '레이어링 무드 팔레트',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A000000180532251ko.jpg?l=ko',
    orig: 34000, price: 20900, pct: 38, stock: 2, badge2: '유통기한',
    summary: '서로 자연스럽게 어우러지는 음영 컬러를 담은 아이섀도 팔레트입니다.',
  },
  {
    id: 'A000000264908', brand: '질레트', name: '질레트 랩스 SON 리미티드 에디션', variant: '핸들+면도날 2입+행어',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026490801ko.jpg?l=ko',
    orig: 44900, price: 28900, pct: 36, stock: 1, badge2: '패키지 파손',
    summary: '밀착 면도를 돕는 면도기와 교체용 면도날로 구성된 한정 기획입니다.',
  },
  {
    id: 'A000000261842', brand: '바이오던스', name: '바이오던스 리얼 딥 마스크 7+1매', variant: '바이오 콜라겐 리얼 딥 마스크',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026184212ko.jpg?l=ko',
    orig: 35000, price: 22400, pct: 36, stock: 4, badge2: '유통기한',
    summary: '오래 밀착해 수분과 탄력 케어를 돕는 하이드로겔 마스크 기획입니다.',
    talk: '하이드로겔이 피부에 얇게 밀착되고 시간이 지날수록 투명해져 홈케어하는 재미가 있는 마스크예요. 세안 후 물기를 충분히 닦고 밀착시키면 들뜨지 않고 촉촉한 마무리감을 느낄 수 있어요.',
  },
  {
    id: 'A000000262602', brand: '아누아', name: '아누아 PDRN 히알루론산 캡슐 100 세럼', variant: '30ml 더블 기획',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026260213ko.png?l=ko',
    orig: 57500, price: 26900, pct: 53, stock: 3, badge2: '패키지 파손',
    summary: '수분감 있는 제형이 피부에 편안하게 스며드는 보습 세럼 기획입니다.',
  },
  {
    id: 'A000000263664', brand: '토리든', name: '토리든 다이브인 저분자 히알루론산 세럼', variant: '50ml+리필 50ml 기획',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026366410ko.png?l=ko',
    orig: 36000, price: 23000, pct: 36, stock: 6, badge2: '유통기한',
    summary: '가볍고 산뜻한 수분 레이어링을 돕는 히알루론산 세럼입니다.',
  },
  {
    id: 'A000000258679', brand: '웨이크메이크', name: '웨이크메이크 래스팅 글로우 스틱', variant: '03 로지 글로우',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025867932ko.jpg?l=ko',
    orig: 16000, price: 9900, pct: 38, stock: 2, badge2: '패키지 파손',
    summary: '간편하게 덧바를 수 있고 촉촉한 광택을 더해주는 스틱 타입 립 제품입니다.',
    talk: '거울 없이도 쉽게 덧바를 수 있는 스틱 타입이라 파우치에 넣고 다니기 좋아요. 입술 중앙부터 가병게 펼쳐 바르면 부담스럽지 않은 광택이 살아나고, 여러 번 레이어링해도 답답하지 않아요.',
  },
  {
    id: 'A000000261864', brand: '에스트라', name: '에스트라 아토베리어365 크림 80ml 기획', variant: '크림+토너+클렌징폼 기획',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026186405ko.jpg?l=ko',
    orig: 33000, price: 21400, pct: 35, stock: 5, badge2: '유통기한',
    summary: '건조한 피부의 장벽 보습 관리에 적합한 데일리 크림 기획입니다.',
  },
  {
    id: 'A000000263510', brand: '라운드랩', name: '라운드랩 자작나무 수분 선크림 1+1', variant: '50ml+50ml 기획',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0026/A00000026351004ko.png?l=ko',
    orig: 25000, price: 16000, pct: 36, stock: 4, badge2: '패키지 파손',
    summary: '촉촉하고 편안한 사용감으로 데일리 자외선 차단을 돕는 선크림입니다.',
  },
  {
    id: 'A000000259872', brand: '에이프릴스킨', name: '에이프릴스킨 히어로쿠션 2.0', variant: '21N 아이보리 (본품+리필)',
    img: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025987265ko.jpg?l=ko',
    orig: 33000, price: 21000, pct: 36, stock: 1, badge2: '유통기한',
    summary: '얇고 균일하게 밀착되어 매끈한 피부 표현을 돕는 쿠션 기획입니다.',
    talk: '소량만 퍼프에 묻혀 얇게 두드리면 들뜨지 않고 매끈한 피부 표현이 완성돼요. 커버가 더 필요한 부분만 한 번 더 레이어링하면 두께감은 줄이면서 오랜 시간 깔끔한 베이스를 유지할 수 있어요.',
  },
];

// 온페(ONLYONEFAIR) 기간 CJ인재원점에서만 픽업할 수 있는 한정 기획으로, 15종 정규 카탈로그와 분리해 둔다.
export const EXCLUSIVE_PRODUCTS = [
  {
    id: 'ONLYONEFAIR-CLOVER-MAP', brand: '올리브영', name: '[온페한정] 행운만땅 올클맵 엽서 기획세트', variant: '올클맵 QR 엽서 1매 + 네 잎 클로버 클립 1개',
    img: '/photos/product-clover-postcard.jpg',
    orig: 7770000, price: 0, pct: 100, stock: 7, exclusive: true,
    summary: 'ONLYONEFAIR 잘8영 부스(A111)에서만 만나는 올클맵 한정 기획세트입니다. 뒷면 QR을 찍으면 올클맵이 바로 열리는 엽서 1매와 네 잎 클로버 클립 1개로 구성되어 있고, CJ인재원점 픽업으로만 수령할 수 있습니다.',
    talk: '온페 기간 동안 CJ인재원점에서만 픽업할 수 있는 한정 세트예요. 엽서 뒷면 QR을 찍으면 바로 올클맵이 열리고, 함께 들어 있는 클로버 클립은 다이어리나 텀블러에 달아 두기 좋아요.',
  },
];

const CREW_TALK_DETAIL = ' 매장에서 직접 발색과 사용감을 비교해 보고 고른 팁이라 처음 사용하시는 분도 어렵지 않게 따라 할 수 있어요. 궁금한 점은 매장 크루에게 편하게 문의해 주세요.';

export const STORE_NEWS_TALKS = [
  { id: 'store-talk-p1', product: PRODUCTS[0], date: '2026.08.19', message: PRODUCTS[0].talk },
  { id: 'store-talk-p2', product: PRODUCTS[1], date: '2026.08.19', message: '패키지에 작은 찌그러짐이 있지만 내부 마스크팩과 에센스는 정상적으로 밀봉되어 있고 사용에는 전혀 문제가 없어요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p3', product: PRODUCTS[2], date: '2026.08.16', message: PRODUCTS[2].talk },
  { id: 'store-talk-p4', product: PRODUCTS[3], date: '2026.08.12', message: '브러시를 뽑아 사용하면 마스카라처럼 자연스러운 가닥 속눈썹을 연출할 수 있어요! 속눈썹이 풍성해 보이는 매력까지 챙길 수 있답니다... ♡' + CREW_TALK_DETAIL },
  { id: 'store-talk-p5', product: PRODUCTS[4], date: '2026.08.12', message: '다크서클과 작은 잡티를 커버할 때 꼭 챙기는 아이템이에요! 화홍 258 브러쉬와 함께 사용하면 경계가 남지 않게 얇고 균일하게 밀착돼요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p6', product: PRODUCTS[0], date: '2026.08.10', message: '차분하면서도 맑은 생기를 더해주는 컬러라 데일리 치크로 추천드려요. 소량만 묻혀 여러 번 터치하면 취향에 맞게 발색을 조절하기 쉽답니다.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p7', product: PRODUCTS[1], date: '2026.08.09', message: '얇게 여러 번 레이어링하면 그윽하게 깊은 분위기의 가을 메이크업이 완성돼요. 발색이 한 번에 진하게 올라오지 않아 초보자도 쉽게 사용할 수 있어요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p8', product: PRODUCTS[2], date: '2026.08.08', message: '화장솜에 듬뿍 적셔 토너팩으로 사용하면 자극받은 피부를 편안하게 진정하는 데 도움이 돼요. 남은 에센스는 가볍게 두드려 흡수시켜 주세요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p9', product: PRODUCTS[3], date: '2026.08.06', message: '매일 꾸준히 사용하기 편한 섬세한 브러시 타입의 속눈썹 영양제예요. 속눈썹 뿌리부터 끝까지 얇게 바르고 충분히 말려 주면 깔끔하게 관리할 수 있어요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p10', product: PRODUCTS[4], date: '2026.08.04', message: '세 가지 컬러를 피부 톤에 맞게 섞어 쓰면 붉은 잡티와 푸른 다크서클을 자연스럽게 커버할 수 있어요. 얇게 레이어링하면 들뜨지 않고 매끈하게 유지돼요.' + CREW_TALK_DETAIL },
  { id: 'store-talk-p11', product: PRODUCTS[0], date: '2026.08.01', message: '투명하게 맑은 발색으로 올라오는 피치 컬러라 화사한 메이크업을 좋아하는 분께 추천해요. 양쪽 볼에 얇게 펼쳐 바르면 자연스러운 생기가 돌아요.' + CREW_TALK_DETAIL },
];

export const CREW_TALKS = [
  { id: 'talk-p1', product: PRODUCTS[0], store: STORES[0], date: '2026.08.19', message: PRODUCTS[0].talk },
  { id: 'talk-p2', product: PRODUCTS[1], store: STORES[1], date: '2026.08.19', message: STORE_NEWS_TALKS[6].message },
  { id: 'talk-p3', product: PRODUCTS[2], store: STORES[2], date: '2026.08.16', message: PRODUCTS[2].talk },
  { id: 'talk-p4', product: PRODUCTS[3], store: STORES[3], date: '2026.08.12', message: STORE_NEWS_TALKS[3].message },
  { id: 'talk-p5', product: PRODUCTS[4], store: STORES[4], date: '2026.08.12', message: STORE_NEWS_TALKS[4].message },
  { id: 'talk-p6', product: PRODUCTS[5], store: STORES[5], date: '2026.08.10', message: PRODUCTS[5].talk },
  { id: 'talk-p7', product: PRODUCTS[6], store: STORES[6], date: '2026.08.09', message: STORE_NEWS_TALKS[10].message },
  { id: 'talk-p8', product: PRODUCTS[7], store: STORES[7], date: '2026.08.08', message: STORE_NEWS_TALKS[7].message },
  { id: 'talk-p9', product: PRODUCTS[8], store: STORES[8], date: '2026.08.06', message: PRODUCTS[8].talk },
  { id: 'talk-p10', product: PRODUCTS[9], store: STORES[9], date: '2026.08.04', message: STORE_NEWS_TALKS[9].message },
];

export const STORE_NOTICES = [
  { id: 'notice-1', date: '2026.08.19', message: '[입고알림] 라스트픽 온라인 입고 완료되었습니다.' },
  { id: 'notice-2', date: '2026.08.19', message: '[운영안내] 금일 재고 점검으로 픽업 수령이 20분 가량 지연될 수 있습니다.' },
  { id: 'notice-3', date: '2026.08.12', message: '[입고알림] 라스트픽 오프라인 입고 완료되었습니다.' },
  { id: 'notice-4', date: '2026.08.12', message: '[입고알림] 라스트픽 온라인 입고 완료되었습니다.' },
  { id: 'notice-5', date: '2026.08.01', message: '[운영안내] 매장 오픈 시간 : 오전 09:00 ~ 오후 10:30' },
];

const STORE_NEWS_COUNTS = [
  { notice: 3, crew: 4 },
  { notice: 5, crew: 6 },
  { notice: 2, crew: 5 },
  { notice: 4, crew: 7 },
  { notice: 3, crew: 3 },
  { notice: 5, crew: 5 },
  { notice: 4, crew: 4 },
  { notice: 3, crew: 7 },
  { notice: 5, crew: 3 },
  { notice: 1, crew: 1 },
];

const STORE_NOTICE_COPY = [
  (label) => `[입고알림] ${label} 인기 상품 재입고가 완료되었습니다.`,
  (label) => `[픽업안내] ${label} 픽업존은 계산대 오른쪽에 마련되어 있습니다.`,
  () => '[운영안내] 원활한 수령을 위해 방문 전 픽업 완료 알림을 확인해 주세요.',
  () => '[혜택안내] 오늘 매장에서만 적용되는 라스트픽 추가 할인 상품이 준비되어 있습니다.',
  () => '[재고안내] 인기 색상은 조기 품절될 수 있으며 매장 상황에 따라 수량이 달라질 수 있습니다.',
];

const STORE_LEAD_NOTICES = {
  town: '[행사안내] 명동 타운 한정 뷰티위크 체험존을 운영합니다.',
  chungmuro: '[픽업안내] 충무로역점 픽업존 운영 시간이 변경되었습니다.',
};

const STORE_LEAD_TALKS = {
  town: '명동 타운 크루가 추천하는 데일리 조합이에요. 컬러와 사용감을 직접 비교해 고른 상품이라 처음 사용해도 부담 없이 연출할 수 있어요.',
  chungmuro: '충무로역점 크루가 직접 비교한 제품이에요. 얇게 여러 번 사용하면 들뜸 없이 자연스럽게 밀착되어 데일리로 활용하기 좋아요.',
};

function formatNewsDate(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '.');
}

function storeNewsDate(storeIndex, itemIndex, streamOffset = 0) {
  const date = new Date(Date.UTC(2026, 8, 3));
  date.setUTCDate(date.getUTCDate() - (storeIndex * 2) - streamOffset - (itemIndex * (2 + (storeIndex % 3))));
  return formatNewsDate(date);
}

export function getStoreNewsForStore(store) {
  const storeIndex = Math.max(0, STORES.findIndex((item) => item.id === store?.id || item.name === store?.name));
  const storeId = STORES[storeIndex].id;
  const label = STORES[storeIndex].name.replace(/^올리브영\s*/, '');
  const counts = STORE_NEWS_COUNTS[storeIndex];
  const notices = Array.from({ length: counts.notice }, (_, itemIndex) => ({
    id: `${storeId}-notice-${itemIndex + 1}`,
    date: storeNewsDate(storeIndex, itemIndex),
    message: itemIndex === 0 && STORE_LEAD_NOTICES[storeId]
      ? STORE_LEAD_NOTICES[storeId]
      : STORE_NOTICE_COPY[(storeIndex + itemIndex) % STORE_NOTICE_COPY.length](label),
  }));
  const crewTalks = Array.from({ length: counts.crew }, (_, itemIndex) => {
    const product = PRODUCTS[(storeIndex * 2 + itemIndex) % PRODUCTS.length];
    const productTip = product.talk || `${product.summary}${CREW_TALK_DETAIL}`;
    return {
      id: `${storeId}-store-talk-${itemIndex + 1}`,
      product,
      date: storeNewsDate(storeIndex, itemIndex, 1),
      message: itemIndex === 0 && STORE_LEAD_TALKS[storeId]
        ? STORE_LEAD_TALKS[storeId]
        : `${label} 크루의 추천이에요. ${productTip}`,
    };
  });

  return { notices, crewTalks };
}

export const won = (n) => n.toLocaleString('ko-KR') + '원';
