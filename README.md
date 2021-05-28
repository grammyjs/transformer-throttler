# Grammy Throttler (Transformer)
Throttling transformer for [Grammy](https://github.com/grammyjs/grammY) bot framework, written in [Typescript](https://www.typescriptlang.org/) and built with [Bottleneck](https://github.com/SGrondin/bottleneck).

## About
This throttler aims to limit and queue outgoing Telegram API calls to conform to the official [Telegram API rate limits](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this).

## Configuration
The throttler accepts a single optional argument of the following form:
```typescript
type ThrottlerOptions = {
  global?: Bottleneck.ConstructorOptions;     // For throttling all api calls
  group?: Bottleneck.ConstructorOptions;      // For throttling outgoing group messages
  out?: Bottleneck.ConstructorOptions;        // For throttling outgoing private messages
};
```

The full list of object properties available for `Bottleneck.ConstructorOptions` can be found at [Bottleneck](https://github.com/SGrondin/bottleneck#constructor).

If no argument is passed, the throttler created will use the default configuration settings which should be appropriate for most use cases. The default configuration are as follows:
```typescript
// Outgoing Global Throttler
const globalConfig = {
  reservoir: 30,                  // Number of new jobs that throttler will accept at start
  reservoirRefreshAmount: 30,     // Number of jobs that throttler will accept after refresh
  reservoirRefreshInterval: 1000, // Interval in milliseconds where reservoir will refresh
};

// Outgoing Group Throttler
const groupConfig = {
  maxConcurrent: 1,                // Only 1 job at a time
  minTime: 1000,                   // Wait this many milliseconds to be ready, after a job
  reservoir: 20,                   // Number of new jobs that throttler will accept at start
  reservoirRefreshAmount: 20,      // Number of jobs that throttler will accept after refresh
  reservoirRefreshInterval: 60000, // Interval in milliseconds where reservoir will refresh
};

// Outgoing Private Throttler
const outConfig = {
  maxConcurrent: 1,                // Only 1 job at a time
  minTime: 1000,                   // Wait this many milliseconds to be ready, after a job
};
```

## Usage
```typescript
import { Bot } from 'https://dsr.edjopato.de/grammy/^1.0.0/mod.ts';
import { apiThrottler } from 'https://dsr.edjopato.de/grammy_transformer_throttler/^0.1.0/mod.ts';

const botToken = Deno.env.get('BOT_TOKEN');
if (!botToken) {
  throw Error('BOT_TOKEN is required');
}
const bot = new Bot(botToken);

const throttler = apiThrottler();
bot.api.config.use(throttler);

bot.command('/example', ctx => ctx.reply('I am throttled'));
bot.start();
```
