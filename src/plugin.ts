import { Plugin } from "gramio";
import type { Pagination } from "./pagination.ts";

const REGEX = /pagination:(.*):(.*)/;

export function paginationFor(paginationList: Pagination<any>[]) {
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

			if (data.type === "select")
				return pagination["onSelectCallback"]?.({
					id: data.offset,
					// @ts-expect-error
					context,
				});

			const keyboard = await pagination.getKeyboard(data.offset);

			await context.editReplyMarkup(keyboard);
		},
	);
}
