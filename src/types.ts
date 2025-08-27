import type { CallbackData, InferDataUnpack } from "@gramio/callback-data";
import type { Bot, ContextType } from "gramio";

export interface PaginationDataInput<
	Payload extends CallbackData<any, any> | never = never,
> {
	offset: number;
	limit: number;
	payload: Payload extends CallbackData<any, any>
		? InferDataUnpack<Payload>
		: undefined;
}

export type PaginationDataFunction<
	Data,
	Payload extends CallbackData<any, any> | never = never,
> = (input: PaginationDataInput<Payload>) => Promise<Data[]>;

export interface PaginationItemOutput {
	title: string;
	id: string | number;
}

export type PaginationItemFunction<Data> = (data: Data) => PaginationItemOutput;

export interface PaginationOnSelectInput<
	Payload extends CallbackData<any, any> | never = never,
> {
	id: string | number;
	context: ContextType<Bot, "callback_query">;
	payload: Payload extends CallbackData<any, any>
		? InferDataUnpack<Payload>
		: undefined;
}

export type PaginationOnSelectFunction<
	Data,
	Payload extends CallbackData<any, any> | never = never,
> = (data: PaginationOnSelectInput<Payload>) => void;

export type PaginationGetCountFunction = () => Promise<number>;

export interface PaginationPageInfo {
	totalPages: number;
	currentPage: number;
}

export type IsNever<T> = [T] extends [never] ? true : false;

export type PaginationSelectCallbackDataFunction<
	Data,
	Payload extends CallbackData<any, any> | never = never,
> = (data: {
	id: string | number;
	payload: Payload extends CallbackData<any, any>
		? InferDataUnpack<Payload>
		: undefined;
}) => string;
