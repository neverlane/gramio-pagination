import { InlineKeyboard } from "@gramio/keyboards";
import type { PaginationDataFunction } from "./types.ts";

export class Pagination<Data> {
	private getData: PaginationDataFunction<Data>;
	private columnsValue: number | undefined;

	constructor(func: PaginationDataFunction<Data>) {
		this.getData = func;
	}

	columns(count: number) {
		this.columnsValue = count;
	}

	async getKeyboard(offset: number) {
		const data = await this.getData({ offset });

		return new InlineKeyboard().columns(this.columnsValue);
	}
}
