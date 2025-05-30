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
