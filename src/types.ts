import type { Bot, ContextType } from "gramio";

export interface PaginationDataInput {
	offset: number;
	limit: number;
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
	context: ContextType<Bot, "callback_query">;
}

export type PaginationOnSelectFunction<Data> = (
	data: PaginationOnSelectInput,
) => void;
