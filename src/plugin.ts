import { Plugin } from "gramio";
import type { AnyPagination } from "./pagination.ts";

export function paginationFor(paginationList: AnyPagination[]) {
	return new Plugin("@gramio/pagination").on(
		"callback_query",
		async (context, next) => {
			const pagination = paginationList.find((p) =>
				// biome-ignore lint/complexity/useLiteralKeys: <explanation>
				p["callbackData"].filter(context.data),
			);

			if (!pagination) {
				return next();
			}

			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			const data = pagination["callbackData"].unpack(context.data);

			console.log(data);

			let offset = data.offset;

			if (data.type === "select")
				return pagination["onSelectCallback"]?.({
					id: data.offset,
					// @ts-expect-error
					context,
					payload: data.payload,
				});

			if (data.type === "set_page") {
				offset = data.offset > 0 ? pagination["limitValue"] * data.offset : 0;
			}

			const keyboard = await pagination.getKeyboard(
				offset,
				// @ts-expect-error
				"payload" in data ? data.payload : undefined,
			);

			await context.editReplyMarkup(keyboard);
		},
	);
}
