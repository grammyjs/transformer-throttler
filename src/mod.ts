import { Bottleneck } from './deps.deno.ts';
import type { MiddlewareFn, Transformer } from './deps.deno.ts';

type APIThrottlerOptions = {
  global?: Bottleneck.ConstructorOptions;
  group?: Bottleneck.ConstructorOptions;
  out?: Bottleneck.ConstructorOptions;
};

const skipSet = new Set();

const bypassThrottler: MiddlewareFn = async (ctx, next) => {
  let willSkip = true;
  ctx.api.config.use(async (prev, method, payload, signal) => {
    if (!willSkip) {
      return prev(method, payload, signal);
    }

    // Note: Depends on referential equality which is not guaranteed
    willSkip = false;
    skipSet.add(payload);
    const result = await prev(method, payload, signal);
    skipSet.delete(payload);
    return result;
  });
  await next();
};

const apiThrottler = (
  opts: APIThrottlerOptions = {},
): Transformer => {
  const globalConfig: Bottleneck.ConstructorOptions = opts.global ?? {
    reservoir: 30,
    reservoirRefreshAmount: 30,
    reservoirRefreshInterval: 1000,
  };
  const groupConfig: Bottleneck.ConstructorOptions = opts.group ?? {
    maxConcurrent: 1,
    minTime: 1000,
    reservoir: 20,
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 60000,
  };
  const outConfig: Bottleneck.ConstructorOptions = opts.out ?? {
    maxConcurrent: 1,
    minTime: 1000,
  };

  const globalThrottler = new Bottleneck(globalConfig);
  const groupThrottler = new Bottleneck.Group(groupConfig);
  const outThrottler = new Bottleneck.Group(outConfig);
  groupThrottler.on(
    'created',
    (throttler: Bottleneck) => throttler.chain(globalThrottler),
  );
  outThrottler.on(
    'created',
    (throttler: Bottleneck) => throttler.chain(globalThrottler),
  );

  const transformer: Transformer = async (prev, method, payload, signal) => {
    if (!payload || !('chat_id' in payload) || skipSet.has(payload)) {
      return prev(method, payload, signal);
    }

    // @ts-ignore
    const chatId = Number(payload.chat_id);
    const isGroup = chatId < 0;
    const throttler = isGroup
      ? groupThrottler.key(`${chatId}`)
      : outThrottler.key(`${chatId}`);
    return throttler.schedule(() => prev(method, payload, signal));
  };
  return transformer;
};

const BottleneckStrategy = Bottleneck.strategy;
export { BottleneckStrategy };

export type { APIThrottlerOptions };
export { apiThrottler, bypassThrottler };
