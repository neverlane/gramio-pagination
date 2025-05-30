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

			if (data.type === "select") return;

			const keyboard = await pagination.getKeyboard(data.offset);

			await context.editReplyMarkup(keyboard);
		},
	);
}
