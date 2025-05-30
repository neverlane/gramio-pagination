import { CallbackData } from "@gramio/callback-data";
import { InlineKeyboard } from "@gramio/keyboards";
import type {
	PaginationDataFunction,
	PaginationGetCountFunction,
	PaginationItemFunction,
	PaginationOnSelectFunction,
	PaginationPageInfo,
} from "./types.ts";
import { calculatePagination } from "./utils.ts";

export class Pagination<Data> {
	private name: string;
	private getData: PaginationDataFunction<Data>;
	private limitValue = 10;
	private columnsValue: number | undefined;
	private itemDataIterator: PaginationItemFunction<Data> | undefined;
	private onSelectCallback: PaginationOnSelectFunction<Data> | undefined;
	private getCount: PaginationGetCountFunction | undefined;
	private pageInfoFormat: ((data: PaginationPageInfo) => string) | undefined;
	private firstLastPage = false;

	private callbackData: CallbackData<
		{
			type: "select" | "set" | "set_page";
			offset: number;
		},
		{
			type: "select" | "set" | "set_page";
			offset: number;
		}
	>;

	constructor(name: string, func: PaginationDataFunction<Data>) {
		this.name = name;
		this.getData = func;
		this.callbackData = new CallbackData(name)
			.enum("type", ["set", "select", "set_page"])
			.number("offset");
	}

	limit(count: number) {
		this.limitValue = count;

		return this;
	}

	count(func: PaginationGetCountFunction) {
		this.getCount = func;

		return this;
	}

	item(item: PaginationItemFunction<Data>) {
		this.itemDataIterator = item;

		return this;
	}

	columns(count: number) {
		this.columnsValue = count;

		return this;
	}

	onSelect(callback: PaginationOnSelectFunction<Data>) {
		this.onSelectCallback = callback;

		return this;
	}

	withPageInfo(format: (data: PaginationPageInfo) => string) {
		this.pageInfoFormat = format;

		return this;
	}

	withFirstLastPage() {
		this.firstLastPage = true;

		return this;
	}

	async getDataWithPaginationInfo(offset: number) {
		if (!this.getCount) {
			const data = await this.getData({ offset, limit: this.limitValue + 1 });

			return {
				data: data.slice(0, this.limitValue),
				pagination: {
					hasNext: data.length > this.limitValue,
					hasPrevious: offset > 0,
				},
			};
		}

		const [count, data] = await Promise.all([
			this.getCount(),
			this.getData({ offset, limit: this.limitValue }),
		]);

		return {
			data,
			pagination: calculatePagination(count, offset, this.limitValue),
		};
	}

	async getKeyboard(offset: number) {
		const { data, pagination } = await this.getDataWithPaginationInfo(offset);

		console.log(
			data,
			pagination,
			"totalPages" in pagination,
			!!this.pageInfoFormat,
			this.firstLastPage,
			pagination.hasPrevious,
		);

		return new InlineKeyboard({
			enableSetterKeyboardHelpers: true,
		})
			.columns(this.columnsValue)
			.add(
				...data.map((x) => {
					const item = this.itemDataIterator?.(x);

					return InlineKeyboard.text(
						// @ts-expect-error
						item?.title ?? x.title,
						this.callbackData.pack({
							type: "select",
							// @ts-expect-error
							offset: item?.id ?? x.id,
						}),
					);
				}),
			)
			.row()
			.columns(undefined)
			.addIf(
				this.firstLastPage && pagination.hasPrevious,
				InlineKeyboard.text(
					"⏮️",
					this.callbackData.pack({
						type: "set_page",
						offset: 0,
					}),
				),
			)
			.addIf(
				pagination.hasPrevious,
				InlineKeyboard.text(
					"⬅️",
					this.callbackData.pack({
						type: "set",
						offset: offset - this.limitValue,
					}),
				),
			)
			.addIf(
				"totalPages" in pagination && !!this.pageInfoFormat,
				InlineKeyboard.text(
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					this.pageInfoFormat!(pagination as PaginationPageInfo),
					"$noop$",
				),
			)
			.addIf(
				pagination.hasNext,
				InlineKeyboard.text(
					"➡️",
					this.callbackData.pack({
						type: "set",
						offset: offset + this.limitValue,
					}),
				),
			)
			.addIf(
				this.firstLastPage && "totalPages" in pagination && pagination.hasNext,
				InlineKeyboard.text(
					"⏭️",
					this.callbackData.pack({
						type: "set_page",
						offset: (pagination as PaginationPageInfo).totalPages - 1,
					}),
				),
			);
	}
}
