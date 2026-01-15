// valkey.ts
import { GlideClient, GlideFt } from '@valkey/valkey-glide';

const INDEX = 'sc_idx';
const DOC_PREFIX = 'sc:doc:';

// ====== 싱글톤 클라이언트 ======
let _client: GlideClient | null = null;

async function getValkeyClient(): Promise<GlideClient> {
  if (_client) return _client;

  const host = process.env.VALKEY_HOST ?? '127.0.0.1';
  const port = Number(process.env.VALKEY_PORT ?? 6379);

  // 필요하면 TLS/인증 옵션을 여기서 추가
  _client = await GlideClient.createClient({
    addresses: [{ host, port }],
  });

  return _client;
}

// ====== 인덱스 1회 생성 ======
let _indexReady = false;

async function ensureSemanticCacheIndex(client?: GlideClient) {
  if (_indexReady) return;

  const c = client ?? (await getValkeyClient());

  // 이미 존재하면 create가 에러날 수 있어서 먼저 체크
  const indexes = await GlideFt.list(c);
  if (indexes.includes(INDEX)) {
    _indexReady = true;
    return;
  }

  // HASH 문서: sc:doc:*  안의 vec 필드를 벡터로 인덱싱
  // COSINE 거리 기반
  await GlideFt.create(
    c,
    INDEX,
    [
      {
        type: 'VECTOR',
        name: 'vec', // HASH field
        alias: 'VEC', // @VEC 로 검색
        attributes: {
          algorithm: 'HNSW',
          type: 'FLOAT32',
          dimensions: 1536,
          distanceMetric: 'COSINE',
          // 튜닝은 나중에. 일단 동작용 최소.
        },
      },
    ],
    {
      dataType: 'HASH',
      prefixes: [DOC_PREFIX], // sc:doc: 로 시작하는 키만 인덱싱
    },
  );

  _indexReady = true;
}

// ====== 앱 시작 시 1번만 호출 ======
export async function initValkeySemanticCache() {
  const c = await getValkeyClient();
  await ensureSemanticCacheIndex(c);
  return c;
}
