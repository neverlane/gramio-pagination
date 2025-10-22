import {
	CallbackData,
	type InferDataPack,
	type InferDataUnpack,
} from "@gramio/callback-data";
import { InlineKeyboard } from "@gramio/keyboards";
import type {
	IsNever,
	PaginationDataFunction,
	PaginationGetCountFunction,
	PaginationItemFunction,
	PaginationOnSelectFunction,
	PaginationPageInfo,
	PaginationSelectCallbackDataFunction,
	WrapKeyboardFunction,
} from "./types.ts";
import { calculatePagination } from "./utils.ts";

export type AnyPagination = Pagination<any, any>;

export class Pagination<
	Data,
	Payload extends CallbackData<any, any> | never = never,
> {
	private name: string;
	private getData: PaginationDataFunction<Data, Payload>;
	private limitValue = 10;
	private columnsValue: number | undefined;
	private itemDataIterator: PaginationItemFunction<Data> | undefined;
	private onSelectCallback:
		| PaginationOnSelectFunction<Data, Payload>
		| undefined;
	private getCount: PaginationGetCountFunction<Payload> | undefined;
	private pageInfoFormat: ((data: PaginationPageInfo) => string) | undefined;
	private firstLastPage = false;

	private wrapKeyboardHandler: WrapKeyboardFunction<Data, Payload> | undefined;

	private callbackData: CallbackData<
		{
			type: "select" | "set" | "set_page";
			offset: number;
			payload?: InferDataUnpack<Payload>;
		},
		{
			type: "select" | "set" | "set_page";
			offset: number;
			payload?: InferDataUnpack<Payload>;
		}
	>;

	private selectCallbackDataFunction:
		| PaginationSelectCallbackDataFunction<Data, Payload>
		| undefined;

	private payloadInstance: Payload | undefined;

	constructor(name: string, func: PaginationDataFunction<Data, Payload>);
	constructor(
		name: string,
		payload: Payload,
		func: PaginationDataFunction<Data, Payload>,
	);
	constructor(
		name: string,
		funcOrCallbackData: PaginationDataFunction<Data, Payload> | Payload,
		func?: PaginationDataFunction<Data, Payload>,
	) {
		this.name = name;
		this.getData =
			funcOrCallbackData instanceof CallbackData ? func! : funcOrCallbackData!;

		this.payloadInstance =
			funcOrCallbackData instanceof CallbackData
				? funcOrCallbackData
				: undefined;

		const payloadCallbackData =
			this.payloadInstance ?? new CallbackData("noop");

		this.callbackData = new CallbackData(name)
			.enum("type", ["set", "select", "set_page"])
			.number("offset")
			.data("payload", payloadCallbackData, {
				optional: true,
			});
	}

	payload<T extends CallbackData<any, any>>(payload: T): Pagination<Data, T> {
		// @ts-expect-error
		this.payloadInstance = payload;

		return this as any;
	}

	wrapKeyboard(func: WrapKeyboardFunction<Data, Payload>) {
		this.wrapKeyboardHandler = func;

		return this;
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

	onSelect(callback: PaginationOnSelectFunction<Data, Payload>) {
		this.onSelectCallback = callback;

		return this;
	}

	selectCallbackData(
		callback: PaginationSelectCallbackDataFunction<Data, Payload>,
	) {
		this.selectCallbackDataFunction = callback;

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

	async getDataWithPaginationInfo(
		offset: number,
		...args: IsNever<Payload> extends true
			? []
			: [payload: InferDataUnpack<Payload>]
	) {
		if (!this.getCount) {
			const data = await this.getData({
				offset,
				limit: this.limitValue + 1,
				payload: args[0] as never,
			});

			return {
				data: data.slice(0, this.limitValue),
				pagination: {
					hasNext: data.length > this.limitValue,
					hasPrevious: offset > 0,
				},
			};
		}

		const [count, data] = await Promise.all([
			this.getCount(args[0] as never),
			this.getData({
				offset,
				limit: this.limitValue,
				payload: args[0] as never,
			}),
		]);

		return {
			data,
			pagination: calculatePagination(count, offset, this.limitValue),
		};
	}

	async getKeyboardWithData(
		offset = 0,
		...args: IsNever<Payload> extends true
			? []
			: [payload: InferDataUnpack<Payload>]
	): Promise<{
		keyboard: InlineKeyboard;
		data: Data[];
		pagination:
			| {
					totalPages: number;
					currentPage: number;
					hasNext: boolean;
					hasPrevious: boolean;
			  }
			| {
					hasNext: boolean;
					hasPrevious: boolean;
			  };
	}> {
		const { data, pagination } = await this.getDataWithPaginationInfo(
			offset,
			...args,
		);

		const keyboard = new InlineKeyboard({
			enableSetterKeyboardHelpers: true,
		})
			.columns(this.columnsValue)
			.add(
				...data.map((x) => {
					const item = this.itemDataIterator?.(x);

					return InlineKeyboard.text(
						// @ts-expect-error
						item?.title ?? x.title,
						this.selectCallbackDataFunction?.({
							// @ts-expect-error
							id: item?.id ?? x.id,
							payload: args[0] as never,
							offset,
							limit: this.limitValue,
						}) ??
							this.callbackData.pack({
								type: "select",
								// @ts-expect-error
								offset: item?.id ?? x.id,
								payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
					}),
				),
			);

		return {
			keyboard:
				this.wrapKeyboardHandler?.({
					keyboard,
					pagination,
					offset,
					limit: this.limitValue,
					data,
					payload: args[0] as never,
				}) ?? keyboard,
			data,
			pagination,
		};
	}

	async getKeyboard(
		offset = 0,
		...args: IsNever<Payload> extends true
			? []
			: [payload: InferDataUnpack<Payload>]
	): Promise<InlineKeyboard> {
		const { data, pagination } = await this.getDataWithPaginationInfo(
			offset,
			...args,
		);

		const keyboard = new InlineKeyboard({
			enableSetterKeyboardHelpers: true,
		})
			.columns(this.columnsValue)
			.add(
				...data.map((x) => {
					const item = this.itemDataIterator?.(x);

					return InlineKeyboard.text(
						// @ts-expect-error
						item?.title ?? x.title,
						this.selectCallbackDataFunction?.({
							// @ts-expect-error
							id: item?.id ?? x.id,
							payload: args[0] as never,
							offset,
							limit: this.limitValue,
						}) ??
							this.callbackData.pack({
								type: "select",
								// @ts-expect-error
								offset: item?.id ?? x.id,
								payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
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
						payload: args[0] as never,
					}),
				),
			);

		return (
			this.wrapKeyboardHandler?.({
				keyboard,
				pagination,
				offset,
				limit: this.limitValue,
				data,
				payload: args[0] as never,
			}) ?? keyboard
		);
	}
}
