export interface PaginationDataInput {
	offset: number;
	limit: number;
}

export type PaginationDataFunction<Data> = (
	input: PaginationDataInput,
) => Promise<Data[]>;
