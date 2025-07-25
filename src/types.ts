import type { Bot, ContextType } from "gramio";

export interface PaginationDataInput {
	offset: number;
	limit: number;
	payload?: string;
}

export type PaginationDataFunction<Data> = (
	input: PaginationDataInput,
) => Promise<Data[]>;

export interface PaginationItemOutput {
	title: string;
	id: string | number;
}

export type PaginationItemFunction<Data> = (data: Data) => PaginationItemOutput;

export interface PaginationOnSelectInput {
	id: string | number;
	payload?: string;
	context: ContextType<Bot, "callback_query">;
}

export type PaginationOnSelectFunction<Data> = (
	data: PaginationOnSelectInput,
) => void;

export type PaginationGetCountFunction = () => Promise<number>;

export interface PaginationPageInfo {
	totalPages: number;
	currentPage: number;
}
