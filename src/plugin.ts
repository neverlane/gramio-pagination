import { Plugin } from "gramio";
import type { Pagination } from "./pagination.ts";

const REGEX = /pagination:(.*):(.*)/;

export function paginationFor(paginationList: Pagination<any>[]) {
	return new Plugin("@gramio/pagination").on(
		"callback_query",
		async (context, next) => {
			const match = context.data.match(REGEX);

			if (!match) {
				return next();
			}

			const [, name, offset] = match;

			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			const pagination = paginationList.find((p) => p["name"] === name);

			if (!pagination) {
				return next();
			}

			console.log(context.data);
			const keyboard = await pagination.getKeyboard(Number(offset));

			await context.editReplyMarkup(keyboard);
		},
	);
}
