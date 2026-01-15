// semantic-cache.ts
import { GlideClient, GlideFt, GlideString } from '@valkey/valkey-glide';

const INDEX = 'sc_idx';
const DOC_PREFIX = 'sc:doc:';

// COSINE: 보통 score=distance(낮을수록 유사), cosineSim = 1 - distance
const MIN_COSINE_SIMILARITY = 0.8;

const sha256Hex = async (s: string) => {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const float32ToBuffer = (v: number[]) =>
  Buffer.from(new Float32Array(v).buffer);

// GET: queryVec(임베딩 벡터)로 시맨틱 캐시 조회
export async function semanticGetByVec(
  client: GlideClient,
  queryVec: number[],
  topK = 1,
): Promise<GlideString | null> {
  const qvec = float32ToBuffer(queryVec);

  const knnQuery = `*=>[KNN ${topK} @VEC $qvec AS score]`;
  const [count, results] = await GlideFt.search(client, INDEX, knnQuery, {
    params: [{ key: 'qvec', value: qvec }],
    returnFields: [
      { fieldIdentifier: 'res' },
      { fieldIdentifier: 'score' }, // AS score로 만든 필드
    ],
  });

  if (!count || !results || results.length === 0) return null;

  const first = results[0] as {
    key: string;
    value: { key: string; value: any }[];
  };

  const fields = Object.fromEntries(
    first.value.map((kv) => [kv.key, kv.value]),
  ) as Record<string, any>;

  const distance = Number(fields.score);
  const cosineSim = 1 - distance;

  if (cosineSim < MIN_COSINE_SIMILARITY) return null;

  return fields.res != null ? String(fields.res) : null;
}

// SET: docKey 한 곳에 vec+res 저장
export async function semanticSetByVec(
  client: GlideClient,
  idSeed: string,
  queryVec: number[],
  response: string,
  ttlSec = 300,
): Promise<void> {
  const id = await sha256Hex(idSeed);
  const docKey = `${DOC_PREFIX}${id}`;
  const vecBuf = float32ToBuffer(queryVec);

  // HASH에 vec(바이너리) + res(문자열) 같이 저장
  await client.hset(docKey, { vec: vecBuf, res: response });
  await client.expire(docKey, ttlSec);
}
