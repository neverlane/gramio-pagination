import { CallbackData } from "@gramio/callback-data";
import { InlineKeyboard } from "@gramio/keyboards";
import type { PaginationDataFunction } from "./types.ts";

export class Pagination<Data> {
	private name: string;
	private getData: PaginationDataFunction<Data>;
	private limitValue = 10;
	private columnsValue: number | undefined;

	private callbackData: CallbackData;

	constructor(name: string, func: PaginationDataFunction<Data>) {
		this.name = name;
		this.getData = func;
		this.callbackData = new CallbackData(name)
			.enum("type", ["set", "select"])
			.number("offset");
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

		return new InlineKeyboard({
			enableSetterKeyboardHelpers: true,
		})
			.columns(this.columnsValue)
			.add(
				...data.map((x) =>
					InlineKeyboard.text(
						x.title,
						this.callbackData.pack({ type: "select", offset: x.id }),
					),
				),
			)
			.row()
			.addIf(
				offset !== 0,
				InlineKeyboard.text(
					"⬅️",
					this.callbackData.pack({
						type: "set",
						offset: offset - this.limitValue,
					}),
				),
			)
			.addIf(
				data.length > this.limitValue,
				InlineKeyboard.text(
					"➡️",
					this.callbackData.pack({
						type: "set",
						offset: offset + this.limitValue,
					}),
				),
			);
	}
}
