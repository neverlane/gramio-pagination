export interface PaginationDataInput {
	offset: number;
}

export type PaginationDataFunction<Data> = (
	input: PaginationDataInput,
) => Promise<Data>;
