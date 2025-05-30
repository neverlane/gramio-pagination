export function calculatePagination(
	count: number,
	offset: number,
	limit: number,
) {
	const totalPages = Math.ceil(count / limit);
	const currentPage = Math.floor(offset / limit) + 1;
	const hasNext = currentPage < totalPages;
	const hasPrevious = currentPage > 1;

	return {
		totalPages,
		currentPage,
		hasNext,
		hasPrevious,
	};
}
