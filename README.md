# @gramio/pagination

[![npm](https://img.shields.io/npm/v/@gramio/pagination?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/pagination)
[![npm downloads](https://img.shields.io/npm/dw/@gramio/pagination?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/@gramio/pagination)
[![JSR](https://jsr.io/badges/@gramio/pagination)](https://jsr.io/@gramio/pagination)
[![JSR Score](https://jsr.io/badges/@gramio/pagination/score)](https://jsr.io/@gramio/pagination)

# Usage

![image](https://raw.githubusercontent.com/gramiojs/pagination/refs/heads/main/assets/example.png)

```ts
const data = [
    {
        id: 1,
        title: "test",
    },
    {
        id: 2,
        title: "test2",
    },
    {
        id: 3,
        title: "test3",
    },
    {
        id: 4,
        title: "test4",
    },
    {
        id: 5,
        title: "test5",
    },
];

const paginationTest = new Pagination("test", async ({ offset, limit }) => {
    return data.slice(offset, offset + limit);
})
    .count(() => Promise.resolve(data.length))
    .item((x) => ({
        title: x.title,
        id: x.id,
    }))
    .onSelect(({ id, context }) => {
        console.log(id, context);

        return context.editText(`Edited ${id}`, {
            reply_markup: context.message?.replyMarkup?.payload,
        });
    })
    .limit(2)
    .columns(2)
    .withFirstLastPage()
    .withPageInfo(
        ({ totalPages, currentPage }) => `${currentPage} / ${totalPages}`
    );

const bot = new Bot(process.env.BOT_TOKEN as string)
    .extend(paginationFor([paginationTest]))
    .command("start", async (ctx) =>
        ctx.reply("Hello", {
            reply_markup: await paginationTest.getKeyboard(0),
        })
    )
    .onStart(console.log);

await bot.start();
```

> [!WARNING]
> This is a work in progress and the API is subject to change.
