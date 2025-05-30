import { InlineKeyboard } from "@gramio/keyboards";
import type { PaginationDataFunction } from "./types.ts";

export class Pagination<Data> {
	private getData: PaginationDataFunction<Data>;
	private limitValue = 10;
	private columnsValue: number | undefined;

	constructor(func: PaginationDataFunction<Data>) {
		this.getData = func;
	}

	limit(count: number) {
		this.limitValue = count;

		return this;
	}

	columns(count: number) {
		this.columnsValue = count;

		return this;
	}

	async getKeyboard(offset: number) {
		const data = await this.getData({ offset, limit: this.limitValue + 1 });

		return new InlineKeyboard().columns(this.columnsValue);
	}
}
